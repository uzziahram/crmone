import jwt from "jsonwebtoken"
import Payload from "@/types/Payload"

const SECRET = process.env.JWT_SECRET!

export function signToken(payload: Payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "1d" })
}

export function verifyToken(token: string) : Payload{
  return jwt.verify(token, SECRET) as Payload
}