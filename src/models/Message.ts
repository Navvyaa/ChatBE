import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
    conversation: Types.ObjectId;
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    content: string;
    delivered: boolean;
    deliveredAt: Date;
    read: boolean;
    readAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        conversation: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        delivered: { type: Boolean, default: false },
        deliveredAt: { type: Date },
        read: { type: Boolean, default: false },
        readAt: { type: Date }
    }, { timestamps: true }
)

export const Message = mongoose.model("Message", messageSchema);