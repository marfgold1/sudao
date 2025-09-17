/* eslint-disable @typescript-eslint/no-explicit-any */
import { Principal } from "@dfinity/principal";

export const Opt = <T>(value: [] | [T]): T | undefined => {
    return value.length === 0 ? undefined : value[0];
};

export const MakeOpt = <T>(value?: T | null): [] | [T] => {
    return value === null || value === undefined ? [] : [value];
};

const textEncoder = new TextEncoder();
export const StringBlobOpt = (value?: string | null): [] | [number[] | Uint8Array] => {
    if (value === null || value === undefined) return [];
    return [textEncoder.encode(value)];
};

export const PrincipalOpt = (value?: Principal | string): [] | [Principal] => {
    if (value instanceof Principal) return [value];
    if (typeof value === 'string') return [Principal.fromText(value)];
    return [];
};

export const PrincipalReq = (value: Principal | string): Principal => {
    if (value instanceof Principal) return value;
    return Principal.fromText(value);
}

export type Resp<T extends (...args: any) => Promise<any>> = Awaited<ReturnType<T>>;
export type OptRespPromise<T extends (...args: any) => Promise<any>> = Promise<Resp<T> | null | undefined>;

export const getResult = <T, E>(result: { ok: T } | { err: E }): [T | undefined, E | undefined] => {
    const ok = getVariant(result, 'ok');
    const err = getVariant(result, 'err');
    if (ok) {
        return [ok, undefined];
    } else {
        return [undefined, err];
    }
}

export function getVariant<T extends Record<any, any>, K extends Keys<T>>(x: T | null | undefined, key: K):
    Values<T, K> | undefined {
    if (!x) return undefined;
    return x[key];
}

export function pairVariant<T extends Record<any, any>, K extends Keys<T>>(x: T | null | undefined, key: K):
    [K, Values<T, K>] | undefined {
    if (!x) return undefined;
    const res = x[key];
    if (res === undefined) return undefined;
    return [key, res];
}


type X = { ok: boolean } | { err: string } | { wowie: string }
const t = { ok: true } as X
matchVariant(t, {
    ok: (val) => val,
    err: () => false,
    wowie: (val) => val === 'wowie',
})
matchVariant(t, {
    ok: (val) => val,
    err: () => false,
})

type Keys<T> = T extends Record<infer K, any> ? K : never;
type Values<T, K extends Keys<T>> = T extends Record<K, infer V> ? V : never;
type KeyMatcher<T> = { [K in Keys<T>]: (val: Values<T, K>) => any }
export function matchVariant(x: null | undefined, matcher: any): undefined;
export function matchVariant<T, M extends KeyMatcher<T>>(x: T, matcher: M): ReturnType<M[Keys<T>]>;
export function matchVariant<T, M extends Partial<KeyMatcher<T>>>(x: T, matcher: M): ReturnType<NonNullable<M[keyof M]>> | undefined;
export function matchVariant<T extends Record<any, any>, TRet>(
    x: T | null | undefined,
    matcher: Record<any, any>,
): TRet | undefined {
    if (x === null || x === undefined) return undefined;
    for (const [k, fn] of Object.entries(matcher)) {
        const res = x[k];
        if (res === undefined) return undefined;
        return fn?.(res);
    }
    return undefined;
}

export function keyVariant<T, K extends Keys<T>>(x?: T) {
    if (!x) return undefined;
    const keys = Object.keys(x);
    if (keys.length === 0) return undefined;
    return keys[0] as K;
}

export function isVariant<T extends Record<any, any>, K extends Keys<T>>(x: T | null | undefined, key: K): boolean {
    return x !== null && x !== undefined && key in x;
}

type LinkList<T> = [] | [[T, LinkList<T>]];
export function* iterLinkList<T>(l: LinkList<T>): Iterable<T> {
    if (l.length === 0) {
        return;
    }
    const [[head, tail]] = l;
    yield head;
    yield* iterLinkList(tail);
}

export function formatTime(time: bigint): string {
    const ms = Number(time / 1000000n);
    return new Date(ms).toString();
}