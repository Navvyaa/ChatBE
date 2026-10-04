import {io as Client, Socket} from "socket.io-client";

export const connectClient = (url:string, token:string) =>
    new Promise<Socket>((resolve,reject)=>{
        const socket= Client(url, {auth:{token}, reconnection:false, forceNew:true});
        socket.once("connect",()=>resolve(socket));
        socket.once("connect_error",(err)=>{
            socket.close();
            reject(err);
        });
    });


export const waitFor= <T=any>(
    socket:Socket,
    event:string,
    filter:(data: T)=>boolean=()=>true,
    timeoutMs=3000
)=>
    new Promise<T>((resolve,reject)=>{
        const timer=setTimeout(()=>{
            socket.off(event,handler);
            reject(new Error(`Timed out waiting for "${event}"`))
        },timeoutMs);
        const handler=(data:T)=>{
            if(!filter(data))   return;
            clearTimeout(timer);
            socket.off(event,handler);
            resolve(data);
        };
        socket.on(event,handler);
    });

export const sleep=(ms:number)=>new Promise((r)=>setTimeout(r,ms));