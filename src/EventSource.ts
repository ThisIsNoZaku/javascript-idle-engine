import { Engine } from "./Engine";

export default interface EventSource {
    on(eventName: string, callback: (engine: Engine, arg:any)=>void):void;
}