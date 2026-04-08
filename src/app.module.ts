/* eslint-disable prettier/prettier */
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './api/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './api/auth/auth.module';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { LabsModule } from './api/labs/labs.module';
import { DistrictModule } from './api/district/district.module';
import { StructureModule } from './api/structure/structure.module';
import { RegionModule } from './api/region/region.module';
import { DepartmentModule } from './api/department/department.module';
import { StructureLevelModule } from './api/structure-level/structure-level.module';
import { PostModule } from './api/post/post.module';
import { RequestsModule } from './api/requests/requests.module';
import { MailModule } from './providers/mail-service/mail.module';
import { TrainingModule } from './api/training/training.module';
import { PersonnalAssignmentModule } from './api/personnal-assignment/personnal-assignment.module';
import { ProfessionalExperienceModule } from './api/professional-experience/professional-experience.module';
import { MailingModule } from './api/mailing/mailing.module';
import { SpecialityModule } from './api/speciality/speciality.module';
import { StaffLevelModule } from './api/staff-level/staff-level.module';
import { MessageModule } from './api/message/message.module';
import { OtpModule } from './api/otp/otp.module';
import { RequestCommentModule } from './api/request-comment/request-comment.module';
import { SdrModule } from './api/sdr/sdr.module';
import { EquipmentCategoriesModule } from './api/equipment-categories/equipment-categories.module';
import { EquipmentTypesModule } from './api/equipment-types/equipment-types.module';
import { EquipmentsModule } from './api/equipments/equipments.module';
import { EquipmentStocksModule } from './api/equipment-stocks/equipment-stocks.module';
import { EquipmentOrdersModule } from './api/equipment-orders/equipment-orders.module';
import { SuppliersModule } from './api/suppliers/suppliers.module';
import { MaintenancesModule } from './api/maintenances/maintenances.module';
import { IntrantCategoriesModule } from './api/intrant-categories/intrant-categories.module';
import { IntrantTypesModule } from './api/intrant-types/intrant-types.module';
import { IntrantsModule } from './api/intrants/intrants.module';
import { IntrantOrdersModule } from './api/intrant-orders/intrant-orders.module';
import { IntrantStocksModule } from './api/intrant-stocks/intrant-stocks.module';
import { IntrantUsagesModule } from './api/intrant-usages/intrant-usages.module';
import { EnvironmentModule } from './api/environment/environment.module';
import { EnvironmentPositionModule } from './api/environment-position/environment-position.module';
import { ContractTypeModule } from './api/contract-type/contract-type.module';
import { PositionModule } from './api/position/position.module';
import { RegionPoleModule } from './api/region-pole/region-pole.module';
import { LabTypeModule } from './api/lab-type/lab-type.module';
import { LabTypePositionModule } from './api/lab-type-position/lab-type-position.module';
import { SubSpecialityModule } from './api/sub-speciality/sub-speciality.module';
import { StructureLevelEquipmentTypeModule } from './api/structure-level-equipment-type/structure-level-equipment-type.module';
import { EquipmentLifeEventsModule } from './api/equipment-life-events/equipment-life-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        privateKey: configService.get<string>('privateKey').replace(/\\n/g, '\n'),
        publicKey: configService.get<string>('publicKey').replace(/\\n/g, '\n'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: '1d',
        },
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('dbUrl'),
      }),
    }),
    AuthModule,
    UserModule,
    LabsModule,
    DistrictModule,
    StructureModule,
    RegionModule,
    DepartmentModule,
    StructureLevelModule,
    StructureLevelEquipmentTypeModule,
    PostModule,
    RequestsModule,
    MailModule,
    TrainingModule,
    PersonnalAssignmentModule,
    ProfessionalExperienceModule,
    SpecialityModule,
    StaffLevelModule,
    MailingModule,
    MessageModule,
    OtpModule,
    RequestCommentModule,
    SdrModule,
    SuppliersModule,
    MaintenancesModule,
    EquipmentCategoriesModule,
    EquipmentTypesModule,
    EquipmentsModule,
    EquipmentLifeEventsModule,
    EquipmentStocksModule,
    EquipmentOrdersModule,
    IntrantCategoriesModule,
    IntrantTypesModule,
    IntrantsModule,
    IntrantOrdersModule,
    IntrantStocksModule,
    IntrantUsagesModule,
    EnvironmentModule,
    EnvironmentPositionModule,
    ContractTypeModule,
    PositionModule,
    RegionPoleModule,
    LabTypeModule,
    LabTypePositionModule,
    SubSpecialityModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST }, // Exclure les routes de connexion
        //{ path: 'auth/register', method: RequestMethod.POST }, // Exclure les routes d'inscription
        { path: 'users/register-lab-admin', method: RequestMethod.POST }, // Exclure l'inscription LabAdmin publique
        { path: 'posts', method: RequestMethod.GET },
        { path: 'posts/:id', method: RequestMethod.GET },
        { path: 'amm-imports', method: RequestMethod.POST }, // Exclure la création de demande AMM (accessible sans authentification)
        { path: 'lab-openings', method: RequestMethod.POST }, // Exclure la création de demande Lab Opening (accessible sans authentification)
        { path: 'sdr-accreditations', method: RequestMethod.POST }, // Exclure la création de demande SDR (accessible sans authentification)
        { path: 'regions', method: RequestMethod.GET },
        { path: 'districts', method: RequestMethod.GET },
        { path: 'labs', method: RequestMethod.GET },
        { path: 'labs/:id', method: RequestMethod.GET },
        { path: 'departments', method: RequestMethod.GET },
        { path: 'structure-levels', method: RequestMethod.GET },
        { path: 'structure-level-equipment-types', method: RequestMethod.GET },
        { path: 'structure-level-equipment-types/:id', method: RequestMethod.GET },
        { path: 'structures', method: RequestMethod.GET },
        { path: 'region-poles', method: RequestMethod.GET },
        { path: 'lab-types', method: RequestMethod.GET },
        { path: 'lab-types/:id', method: RequestMethod.GET },
        { path: 'lab-type-positions', method: RequestMethod.GET },
        { path: 'contract-types', method: RequestMethod.GET },
        { path: 'positions', method: RequestMethod.GET },
        { path: 'specialities', method: RequestMethod.GET },
        { path: 'sub-specialities', method: RequestMethod.GET },
        { path: 'staff-levels', method: RequestMethod.GET },
        { path: 'equipment-categories', method: RequestMethod.GET },
        { path: 'equipment-types', method: RequestMethod.GET },
        { path: 'equipment-orders', method: RequestMethod.GET },
        { path: 'intrants', method: RequestMethod.GET },
        { path: 'intrant-categories', method: RequestMethod.GET },
        { path: 'intrant-types', method: RequestMethod.GET },
        { path: 'structure-levels-equipment-types', method: RequestMethod.GET },
      )
      .forRoutes('*'); // Appliquer à toutes les routes sauf exclusions
  }
}
