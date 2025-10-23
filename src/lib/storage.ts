"use client";

type StorageSerializer<T> = (value: T) => string;
type StorageParser<T> = (raw: string) => T | undefined;

export type StorageSlot<T> = {
  key: string;
  read: () => T | undefined;
  write: (value: T) => void;
  clear: () => void;
};

type StorageSlotOptions<T> = {
  key: string;
  parser?: StorageParser<T>;
  serializer?: StorageSerializer<T>;
};

const defaultSerializer = <T,>(value: T) => JSON.stringify(value);
const defaultParser = <T,>(raw: string) => JSON.parse(raw) as T;

const isBrowser = typeof window !== "undefined";

export function createStorageSlot<T>({
  key,
  parser = defaultParser,
  serializer = defaultSerializer,
}: StorageSlotOptions<T>): StorageSlot<T> {
  const read = () => {
    if (!isBrowser) return undefined;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return undefined;
    try {
      return parser(raw);
    } catch (error) {
      console.error(`[storage] Failed to parse key "${key}"`, error);
      return undefined;
    }
  };

  const write = (value: T) => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, serializer(value));
    } catch (error) {
      console.error(`[storage] Failed to persist key "${key}"`, error);
    }
  };

  const clear = () => {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`[storage] Failed to clear key "${key}"`, error);
    }
  };

  return {
    key,
    read,
    write,
    clear,
  };
}
