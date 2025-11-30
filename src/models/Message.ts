import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
    conversation: Types.ObjectId;
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    content: string;
    read: boolean;
}

const messageSchema = new Schema<IMessage>(
    {
        conversation:{
            type:Schema.Types.ObjectId,
            ref:"Conversation",
            required:true,           
        },
         sender:{type:Schema.Types.ObjectId,ref:"User",required:true},
         receiver:{type:Schema.Types.ObjectId,ref:"User",required:true},
         content:{type:String,required:true},
         read:{type:Boolean,default:false}
    },{timestamps:true}
)

export const Message= mongoose.model("Message",messageSchema);