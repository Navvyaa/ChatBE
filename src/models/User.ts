import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        username: { type: String, required: true,  trim: true },
        email: { type: String, required: true, unique: true, trim: true },
        password: { type: String, required: true, trim: true }
    },
    { timestamps: true }
)

UserSchema.pre("save", async function (this: IUser) {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidate: string) {
    return bcrypt.compare(candidate, this.password);
};



export const User = mongoose.model<IUser>("User", UserSchema)