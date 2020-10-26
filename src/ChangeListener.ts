import {Engine} from "./Engine";

export type ChangeListener = (property:string, value:any, parent?:any, engine?:Engine) => void