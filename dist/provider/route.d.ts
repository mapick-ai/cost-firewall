/**
 * mapick/<upstream>/<model> 路由解析
 */
export interface RouteInfo {
    upstream: string;
    model: string;
}
export declare function parseMapickModelRef(ref: string): RouteInfo | null;
export declare function isMapickModelRef(ref: string): boolean;
//# sourceMappingURL=route.d.ts.map