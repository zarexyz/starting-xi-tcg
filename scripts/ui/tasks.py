# Postfach-Aufgaben: Sperre, Postfach-Abschnitt, Entscheidung (v1.11)
# Aufruf: python3 scripts/ui/tasks.py <ausgabeordner> [url] [en]
import asyncio, sys, os
from playwright.async_api import async_playwright
OUT = sys.argv[1]; URL = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:5190/'
os.makedirs(OUT, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for scheme in ('light', 'dark'):
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, locale='de-DE', color_scheme=scheme)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.route('**/fonts.g*/**', lambda r: r.abort())
            async def js(sel): await pg.evaluate(f"document.querySelector('{sel}')?.click()")
            await pg.goto(URL, wait_until='networkidle')
            await pg.click('[data-action=new-game]'); await pg.fill('#club-name', 'Task FC'); await pg.click('[data-action=found-club]'); await pg.wait_for_timeout(500)
            await pg.click('[data-action=pack-tear]'); await pg.wait_for_timeout(1800)
            for _ in range(10):
                if await pg.query_selector('[data-action=pack-tear]'): break
                await pg.click('[data-action=pack-next]'); await pg.wait_for_timeout(200)
            await pg.click('[data-action=pack-tear]'); await pg.wait_for_timeout(1800)
            await pg.click('[data-action=pack-flip-all]'); await pg.wait_for_timeout(700)
            await pg.click('[data-action=pack-choose][data-index="0"]'); await pg.click('[data-action=pack-confirm]'); await pg.wait_for_timeout(600)
            await pg.evaluate("""async()=>{const m=await import('/src/engine/tasks.js');window.__sxi.act(s=>{
              m.addTask(s,'test','news.welcome',{},{blocking:true,choices:[{key:'yes',label:'task.view',tone:'primary'},{key:'no',label:'task.done'}]});
              m.addTask(s,'test','news.welcome',{},{blocking:false,cta:{label:'task.view',go:'squad'}});})}""")
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{OUT}/home-{scheme}.png')
            await js('[data-action=open-tasks]'); await pg.wait_for_timeout(300)
            assert await pg.locator('.sheet').count(), 'Sperre-Sheet fehlt'
            assert not await pg.locator('.fullscreen').count(), 'Vorbereitung trotz Sperre geöffnet'
            await pg.evaluate("window.__sxi.store.ui && 0")
            await pg.screenshot(path=f'{OUT}/blocked-{scheme}.png')
            await js('.task-list [data-action=open-news]'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{OUT}/news-{scheme}.png')
            await js('[data-action=task-choice]'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{OUT}/after-{scheme}.png')
            await js('[data-action=close-sheet]'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
            await js('[data-action=open-prep]'); await pg.wait_for_timeout(300)
            print(scheme, 'Vorbereitung offen:', await pg.locator('.fullscreen').count() > 0, 'Fehler:', errs)
            await ctx.close()
asyncio.run(main())
