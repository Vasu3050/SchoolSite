import mongoose, {Schema} from 'mongoose';

const studentSchema = new Schema({
    name : {
        type : String,
        required : true,
        trim: true,
        minlength: 3,
        maxlength: 100,
    },

    age : {
        type : Number,
        required : true,
        min: 5,
        max: 100,
    },

    class : {
        type : String,
        required : true,
        trim: true,
    },

    division : {
        type : String,
        required : true,
        trim: true,
        default: 'A',
    },

    parent : [
        {
            type : Schema.Types.ObjectId,
            ref : 'User',
        }
    ],
},
{
    timestamps: true,
});

export const Student = mongoose.model('Student', studentSchema);

