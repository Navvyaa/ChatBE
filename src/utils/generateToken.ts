import jwt from "jsonwebtoken";

export const generateToken = async (email: string, id: string)=>{
    return  jwt.sign(
        {id,email},
        process.env.JWT_SECRET as string,
        {expiresIn:"5d"}
    )
}

export const generateRefreshToken = async (id: string) => {
    return jwt.sign(
        { id },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: "30d" }  
    )
}