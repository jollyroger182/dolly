interface CacheInit {
  expiry?: number
}

interface CacheItem<T> {
  expires: number
  data: T
}

export class Cache<K, V> {
  private map = new Map<K, CacheItem<V>>()
  private expiry: number

  constructor({ expiry = 5 * 60 * 1000 }: CacheInit = {}) {
    this.expiry = expiry
  }

  private _clean() {
    const now = Date.now()
    this.map
      .entries()
      .filter(([k, v]) => v.expires < now)
      .map(([k]) => k)
      .forEach((k) => this.map.delete(k))
  }

  set(key: K, value: V, expiry?: number) {
    this._clean()
    this.map.set(key, {
      expires: Date.now() + (expiry ?? this.expiry),
      data: value,
    })
  }

  get(key: K) {
    const item = this.map.get(key)
    if (!item) return
    if (item.expires < Date.now()) {
      this.map.delete(key)
      return
    }
    return item.data
  }
}
