import request from "supertest";
import app from "../../src/app";

export const validUser = (
    overrides: Partial<{username:string, email:string; password:string}>={}
)=>({
    username :"alice",
    email:"alice@example.com",
    password: "Pass@1234",
    ...overrides,
});

export const registerAndLogin= async (
    overrides:Partial<{username:string; email:string; password:string}>={}
)=>{
    const creds= validUser(overrides);
    await request(app).post("/api/auth/register").send(creds);
    const res= await request(app)
        .post("/api/auth/login")
        .send({email:creds.email, password:creds.password});
    return {
        id:res.body.user.id as string,
        accessToken: res.body.accessToken as string,
        refreshToken:res.body.refreshToken as string,
        ...creds,
    };
}
