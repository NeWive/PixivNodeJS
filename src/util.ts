export function checkHasProperty(target: Object, property: string): boolean {
    return Object.prototype.hasOwnProperty.call(target, property);
}