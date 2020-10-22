import stringMatching = jasmine.stringMatching;

const builtInProperties = ["constructor", "nodeType", "tagName"];
export default function (objectToWrap: any) {
    const handler:ProxyHandler<any> = {
        get: function (target:any, p:string, receiver: any) {
            if(!objectToWrap.propertyIsEnumerable(p) && !builtInProperties.includes(p)) {
                throw new Error(`Property ${p} doesn't exist on a managed object. To interact with a property on a managed object, ensure that it exists in your configuration.`);
            }
            return objectToWrap[p];
        },
        set: function (target, p, value, receiver) {
            throw new Error("Engine managed properties cannot be assigned directly. To change the contained value, use the set method.");
        }
    }
    return new Proxy(objectToWrap, handler);
}