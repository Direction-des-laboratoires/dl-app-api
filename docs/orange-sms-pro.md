# Intégration Orange SMS Pro (OSMS)

Ce document décrit l'intégration de l'API SMS HTTP d'**Orange SMS Pro** dans
`dl-app-api`, et comment l'exploiter/maintenir.

- Provider : [`src/providers/sms-service/osms.service.ts`](../src/providers/sms-service/osms.service.ts)
- Câblage : [`src/api/message/message.module.ts`](../src/api/message/message.module.ts)
- Utilisation : [`src/api/message/message.service.ts`](../src/api/message/message.service.ts) (`sendSmsWithOSMS`)
- Config : [`src/config/configuration.ts`](../src/config/configuration.ts)

---

## 1. Principe

Orange SMS Pro expose **un seul endpoint HTTP** (GET ou POST) :

```
https://api.orangesmspro.sn:8443/api
```

Chaque envoi de SMS doit être **signé**. On ne transmet pas la clé privée :
on calcule pour chaque requête une **clé publique à usage unique** (`key`),
dérivée d'un HMAC-SHA1 (ou MD5) de la concaténation des paramètres.

Différences notables vs l'ancien provider Promobile :

| Aspect | Promobile | Orange SMS Pro |
|---|---|---|
| Authentification | Header `Token` | Signature `key` (HMAC) recalculée par requête |
| Destinataires | plusieurs par requête | **un seul** `recipient` par requête |
| Champ `subject` | absent | **obligatoire** |
| Réponse | JSON | **texte clé/valeur** à parser |

---

## 2. Secrets & configuration

Trois secrets sont fournis depuis le compte Orange SMS Pro
(_Paramètres > API_) :

| Élément | Rôle |
|---|---|
| **Token** | identifie le compte (≈ login/mot de passe) |
| **Clé privée** | secret HMAC, **jamais transmise** dans la requête |
| **Clé publique (`key`)** | signature calculée à chaque envoi, valable **une seule fois** |

### Variables d'environnement

Ajouter dans le `.env` (aucune valeur n'est en dur dans le code) :

```dotenv
OSMS_SMS_URL=https://api.orangesmspro.sn:8443/api   # optionnel (valeur par défaut)
OSMS_TOKEN=<token du compte>
OSMS_PRIVATE_KEY=<clé privée>
OSMS_SIGNATURE=<Sender validé par Orange, ex: nom entreprise>
OSMS_ALGO=HMAC                                       # HMAC (défaut) ou md5
```

> ⚠️ La **`signature`** (Sender affiché au destinataire) doit être **validée
> côté Orange**, sinon l'envoi échoue avec le code `102`.

---

## 3. Calcul de la clé publique

C'est le point critique de l'intégration. La chaîne à hasher respecte un
**ordre strict** :

```
chaine = token + subject + signature + recipient + content + timestamp
key    = HMAC_SHA1(chaine, cléPrivée)         # rendu hexadécimal
# ou, si algo=md5 :
key    = MD5(chaine + cléPrivée)
```

Implémentation (`osms.service.ts`) :

```ts
const chaine = token + subject + signature + recipient + content + timestamp;
// HMAC (défaut)
crypto.createHmac('sha1', privateKey).update(chaine).digest('hex');
// MD5
crypto.createHash('md5').update(chaine + privateKey).digest('hex');
```

Règles à respecter (sinon erreurs `115` / `121`) :

- **Ordre exact** des champs (ce n'est ni l'ordre alphabétique, ni l'ordre de l'URL).
- Le `timestamp` (Unix, en **secondes**) utilisé dans le calcul doit être
  **exactement** celui envoyé dans la requête.
- `subject` et `content` doivent être les valeurs **brutes** (avant URL-encoding).
- La `key` est à **usage unique** : on régénère `timestamp` + `key` à **chaque**
  SMS (y compris dans une boucle multi-destinataires). Le provider envoie donc
  les destinataires **en séquentiel**.

---

## 4. Paramètres de la requête

| Nom | Obligatoire | Description |
|---|---|---|
| `token` | Oui | token du compte |
| `subject` | Oui | objet du message (métadonnée) |
| `signature` | Oui | Sender (nom affiché) — doit être validé par Orange |
| `content` | Oui | contenu du SMS |
| `recipient` | Oui | **un seul** numéro, format `<indicatif><numéro>` sans `+` (ex. `221771234567`) |
| `key` | Oui | clé publique calculée (cf. §3) |
| `timestamp` | Oui | timestamp Unix (secondes) de la requête |
| `algo` | Non | `HMAC` (défaut) ou `md5` |

Le formatage du numéro est assuré par `formatPhoneForSenegalSms`
(produit `221…` sans `+`).

---

## 5. Réponse & codes de retour

> ⚠️ **La doc officielle est trompeuse.** Elle annonce une réponse en **texte**
> (`STATUS_CODE: 200`…). En réalité, l'API renvoie du **JSON** avec un HTTP 200
> même en cas d'erreur métier, et des clés **en minuscules** :

```json
{
  "response": [
    {
      "status_code": 200,
      "status_text": "Message envoye",
      "message_id": 264,
      "messagedetail_id": 418,
      "recipient": "221771234567",
      "external_id": null
    }
  ]
}
```

Le provider (`parseResponse`) lit `response[0].status_code`. Succès =
`status_code === 200` ; sinon il lève une `HttpException` (`502 Bad Gateway`)
reprenant le code/texte Orange. Un fallback texte est conservé au cas où l'API
reviendrait au format documenté.

Principaux codes d'erreur :

| Code | Signification | Solution |
|---|---|---|
| `200` | Message envoyé | — |
| `401` | Échec d'authentification | vérifier le `token` |
| `100` | Indicatif inconnu | le numéro n'existe pas |
| `101` | Message vide | `content` vide |
| `102` | Signature invalide | faire valider le Sender par le support Kiwi |
| `104` / `113` | Erreur interne serveur | contacter le support |
| `105` / `106` | Numéro vide / incorrect | fournir un destinataire valide |
| `110` | Numéro trop court/long | format `<indicatif><numéro>` sans `+` |
| `107` | Paramètres URL invalides | vérifier tous les paramètres |
| `115` | Requête expirée | clé publique déjà utilisée → en régénérer une |
| `116` | Token invalide | recopier le token depuis le compte |
| `121` | Clé `key` invalide | clé calculée ≠ clé serveur (cf. §3, vérifier la clé privée) |

---

## 6. Utilisation dans le service

Le canal **SMS** de `MessageService.create()` route vers `sendSmsWithOSMS`,
qui :

1. charge les utilisateurs pour la personnalisation (variables de template) ;
2. personnalise `subject`/`content` par destinataire si nécessaire ;
3. appelle `osmsSmsService.sendSms({ to, subject, content })`.

Le contenu envoyé au destinataire est `` `${subject}\n\n${content}` `` (le
`subject` sert aussi de métadonnée obligatoire OSMS).

> Le canal **WhatsApp** et l'envoi des **accès** restent sur le provider
> Promobile.

Exemple d'appel direct du provider :

```ts
await this.osmsSmsService.sendSms({
  to: '221771234567',
  subject: 'Notification',
  content: 'Bonjour, votre compte est activé.',
});
```

### Endpoint de test

Endpoint pour tester rapidement un envoi :

```
POST /api/messages/test-sms
Body : { "to": "221771234567" | ["221...","221..."], "content": "...", "subject"?: "..." }
```

> **Authentification requise.** Bien que la route ne porte pas de `@Roles`,
> l'`AuthMiddleware` global (JWT) s'applique à toutes les routes non exclues.
> Il faut donc un header `Authorization: Bearer <JWT>` valide, sinon la réponse
> est **`401 Unauthorized`** (indépendant du token OSMS).
>
> - Obtenir un JWT : `POST /api/auth/login` (email + mot de passe).
> - Le JWT expire (~24 h) → en régénérer un après expiration.
> - Alternative : exclure `messages/test-sms` de l'`AuthMiddleware`
>   (`app.module.ts` → `.exclude(...)`) pour une route réellement publique.

Exemple `curl` (via tunnel ngrok, plusieurs destinataires) :

```bash
curl -X POST https://cheetah-helping-wrongly.ngrok-free.app/api/messages/test-sms \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -H "Authorization: Bearer <TON_JWT>" \
  -d '{
    "to": ["+221781401217", "+221764015700"],
    "content": "Test Orange SMS Pro depuis DirLabo",
    "subject": "Test"
  }'
```

En local (port dev `3050`) :

```bash
curl -X POST http://localhost:3050/api/messages/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TON_JWT>" \
  -d '{"to":"221771234567","content":"Test Orange SMS Pro"}'
```

> ℹ️ Remplace `<TON_JWT>` par un token obtenu via `auth/login` (ne jamais
> committer un vrai token dans la doc/le code).

Réponse attendue (un objet par destinataire) :

```json
{
  "message": "SMS de test envoyé",
  "data": {
    "status_code": 200,
    "status_text": "Message envoye",
    "message_id": 264,
    "messagedetail_id": 418,
    "recipient": "221781401217",
    "external_id": null
  }
}
```

---

## 7. DLR / accusés de réception (non implémenté)

Deux mécanismes existent côté Orange, à ajouter si un suivi de statut est requis :

- **Push (webhook)** : configurer une URL de notification dans
  _Paramètres > Autres paramètres_. Orange envoie en GET `message_id`,
  `messagedetail_id`, `recipient`, `messageStatus`, `messageReason`, etc.
  ⚠️ Le endpoint doit répondre `{"STATUS":0}` pour acquitter, sinon Orange
  renvoie le DLR en boucle.
- **Pull (à la demande)** :
  `GET https://api.orangesmspro.sn:8443/api/dlr` avec `token`, `id`
  (messagedetail_id, un ou plusieurs), `timestamp`, `key` (même mécanisme de
  signature), `algo` optionnel.

---

## 8. Après toute modification du `.env` : REDÉMARRER

> 🔁 Les variables OSMS (`OSMS_TOKEN`, `OSMS_PRIVATE_KEY`, `OSMS_SIGNATURE`…)
> sont lues **au démarrage** du serveur via `ConfigService` et gardées en
> mémoire. Une modification du `.env` **n'est pas relue à chaud** — même en
> `npm run start:dev` (le watch ne recharge que les fichiers `.ts`).
>
> **Après toute modif du `.env`, arrêter (Ctrl+C) puis relancer le serveur.**

C'est la cause classique d'un `116`/`121` **persistant** alors que le `.env`
semble correct : le process tourne encore avec l'ancienne paire
token/clé en mémoire.

Diagnostic rapide de la paire chargée (masqué) :

```bash
node -e 'const fs=require("fs");const e={};fs.readFileSync(".env","utf8").split(/\r?\n/).forEach(l=>{l=l.trim();if(!l||l.startsWith("#"))return;const i=l.indexOf("=");if(i>-1)e[l.slice(0,i).trim()]=l.slice(i+1).trim()});const m=v=>v?`${v.slice(0,4)}...${v.slice(-4)}`:"(vide)";console.log("TOKEN",m(e.OSMS_TOKEN),"| PRIVATE",m(e.OSMS_PRIVATE_KEY),"| distinct?",e.OSMS_TOKEN!==e.OSMS_PRIVATE_KEY)'
```

---

## 9. Dépannage rapide

Ordre de résolution constaté en pratique : `401` → `116` → `121`.

| Symptôme | Piste |
|---|---|
| **HTTP `401 Unauthorized`** | JWT manquant/expiré — ajouter `Authorization: Bearer <JWT>` (cf. §6). N'a **rien** à voir avec le token OSMS. |
| Code `116` « Token invalide » | `OSMS_TOKEN` erroné. ⚠️ Doit être **distinct** de `OSMS_PRIVATE_KEY` (2 secrets différents dans _Paramètres > API_). **Redémarrer** après modif `.env` (§8). |
| Code `121` « KEY invalide » | La clé publique calculée ≠ celle du serveur Orange. Causes : (1) `.env` corrigé mais serveur **non redémarré** (cause n°1 en pratique, §8) ; (2) paire `OSMS_TOKEN`/`OSMS_PRIVATE_KEY` incohérente ; (3) ordre de concaténation ou encodage (cf. §3). |
| `Configuration Orange SMS Pro incomplète` | `OSMS_TOKEN` / `OSMS_PRIVATE_KEY` / `OSMS_SIGNATURE` manquants |
| Code `115` « Requête expirée » | `key` réutilisée — le provider régénère `timestamp`+`key` par requête |
| Code `102` « Signature invalide » | Sender (`OSMS_SIGNATURE`) non validé par Orange |
| Réponse toujours en échec malgré token valide | l'API renvoie du **JSON** (`response[0].status_code`), pas du texte (cf. §5) |
| Accents mal affichés | contenu normalisé en NFC + query params encodés UTF-8 (déjà géré) |

### Vérifier un envoi hors serveur

Pour tester la chaîne **sans passer par l'API** (utile pour isoler un problème
de config vs de code), un appel direct signé depuis Node reproduit exactement
la logique du provider (formule §3 + parsing JSON §5). ⚠️ Un `status_code: 200`
déclenche un **vrai SMS** (numéro réel, crédits consommés).
