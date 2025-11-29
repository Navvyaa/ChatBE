import jwt from "jsonwebtoken";

export const generateToken = async (email: string, id: string)=>{
    return  jwt.sign(
        {id,email},
        process.env.JWT_SECRET as string,
        {expiresIn:"2d"}
    )
}
