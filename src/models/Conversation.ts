import mongoose ,{Document,Schema, Types} from "mongoose";

export interface IConversation extends Document{
    participants: Types.ObjectId[];
}

const conversationSchema = new Schema <IConversation>(
    {
        participants:[
            {type:Schema.Types.ObjectId, ref:"User",required:true}
        ]
    },
    {timestamps:true}
)

conversationSchema.index({participants:1},{unique:true})


export const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema)