import { WsException } from "@nestjs/websockets";
import { EffectContext } from "./effects.types";


export const getTargetId = (context: EffectContext): string => {
    if (context.targetId) {
        return context.targetId;
    }

    throw new WsException("context does not have targetId");
}