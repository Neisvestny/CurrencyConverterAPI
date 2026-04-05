type CacheEntry<T> = {
	data: T;
	timestamp: number;
};

export class MemoryCache<T> {
	private store = new Map<string, CacheEntry<T>>();

	constructor(private ttl: number) {}

	get(key: string): T | null {
		const entry = this.store.get(key);
		if (!entry) return null;

		if (Date.now() - entry.timestamp > this.ttl) {
			this.store.delete(key);
			return null;
		}

		return entry.data;
	}

	set(key: string, data: T) {
		this.store.set(key, {
			data,
			timestamp: Date.now(),
		});
	}
}
