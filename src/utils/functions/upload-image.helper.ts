import * as fs from 'fs';
export class UploadHelper {
  static customFileName = (req, file, cb) => {
    let customName = (Date.now() + Math.round(Math.random())).toString();
    let fileExtension = '';

    if (file.mimetype.indexOf('jpeg') > -1) {
      fileExtension = '.jpg';
    } else if (file.mimetype.indexOf('png')) {
      fileExtension = '.png';
    }

    customName += fileExtension;

    cb(null, customName);
  };

  static uploadDirectory = async (req, file, cb) => {
    if (!fs.existsSync('./uploads')) {
      await fs.mkdirSync('./uploads');
    }
    cb(null, './uploads');
  };
}
