import * as mongoose from 'mongoose'
import { StructureStatusEnum } from 'src/utils/enums/structure.enum';

export const StructureLevelSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    code:{
        type:String,
        required:true
    },
    status: {
        type: String,
        enum: StructureStatusEnum,
        default: StructureStatusEnum.PUBLIC
    },
    description:{
        type:String,
    },
    created_at: {
    type: Date,
    default: Date.now(),
    },
    updated_at: {
        type: Date,
        default: Date.now(),
    },

})