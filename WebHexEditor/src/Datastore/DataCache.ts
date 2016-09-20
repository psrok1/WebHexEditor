const CACHE_PAGE_SIZE = 4096;
const CACHE_ENTRIES = 10;

interface DataCachePage {
    pageOffset: number;
    pageData: number[];
}

export default class DataCache {
    private cachedPages: DataCachePage[] = [];

    private findPage(pageOffset: number)
    {
        for (var page of this.cachedPages)
            if (page.pageOffset === pageOffset)
                return page;
        return null;
    }

    public getByte(offs: number, requestCb: (offs: number, size: number) => any): number {
        let pageBase = Math.floor(offs / CACHE_PAGE_SIZE) * CACHE_PAGE_SIZE;
        let pageDataOffs = offs % CACHE_PAGE_SIZE;
        let page = this.findPage(pageBase);

        // No page in cache? We need to send request for it
        if (!page) {
            requestCb(pageBase, CACHE_PAGE_SIZE);
            return null;
        } else {
            // Return requested byte
            // It may be undefined, if we reached point after end of file
            return page.pageData[pageDataOffs];
        }
    }

    public setByte(offs: number, value: number) {
        // Single-byte edit should be absolutely transparent
        // We can manually update cache without invalidating whole cache
        let pageBase = Math.floor(offs / CACHE_PAGE_SIZE) * CACHE_PAGE_SIZE;
        let pageDataOffs = offs % CACHE_PAGE_SIZE;
        let page = this.findPage(pageBase);

        if (!page) {
            // Sometimes setByte can be called on invalidated page
            return;
        }

        // Updating byte in cache
        page.pageData[pageDataOffs] = value;
    }

    public insertByte(offs: number, value: number) {
        // Single-byte insertion should be also transparent
        // Unfortunately, sometimes we need to invalidate some pages
        let pageBase = Math.floor(offs / CACHE_PAGE_SIZE) * CACHE_PAGE_SIZE;
        let pageDataOffs = offs % CACHE_PAGE_SIZE;
        let page = this.findPage(pageBase);

        if (!page) {
            // Sometimes insertByte can be called on invalidated page
            return;
        }

        // Updating byte in cache
        page.pageData.splice(pageDataOffs, 0, value);
        page.pageData = page.pageData.slice(0, CACHE_PAGE_SIZE);

        // We need to invalidate other pages (most simple)
        this.cachedPages = [page];
    }

    public insertPage(pageOffset: number, pageData: number[]) {
        var page = this.findPage(pageOffset);

        // If page not found in cache: we need to create new one
        if (!page) {
            page = {pageOffset: null, pageData: null}
            this.cachedPages.push(page)
        }

        // Update page entry
        page.pageOffset = pageOffset;
        page.pageData   = pageData.slice();

        // If too many entries: pop first
        if (this.cachedPages.length > CACHE_ENTRIES)
            this.cachedPages.shift();
    }

    public invalidate() {
        this.cachedPages = [];
    }
}