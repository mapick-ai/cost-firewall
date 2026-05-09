/**
 * mapick/<upstream>/<model> 路由解析
 */
export function parseMapickModelRef(ref) {
    if (!ref.startsWith("mapick/"))
        return null;
    const parts = ref.slice("mapick/".length).split("/");
    if (parts.length < 2)
        return null;
    const upstream = parts[0];
    const model = parts.slice(1).join("/");
    if (!upstream || !model)
        return null;
    return { upstream, model };
}
export function isMapickModelRef(ref) {
    return ref.startsWith("mapick/");
}
//# sourceMappingURL=route.js.map