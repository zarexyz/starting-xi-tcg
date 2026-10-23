# =============================================================================
# Live-Spiel-Test: spielt mehrere Live-Spiele mit Halbzeit-Ansage und Wechsel
# und prüft, dass die Zahl der Tor-Einträge im Ticker zum Endstand passt.
# Aufruf: python3 scripts/ui/live.py [url] [anzahl]   (Server wie bei smoke.py)
# =============================================================================
import asyncio, sys
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5190/'
N = int(sys.argv[2]) if len(sys.argv) > 2 else 5

async def main():
    bad = 0
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, locale='de-DE')
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        async def js(sel): await pg.evaluate(f"document.querySelector('{sel}')?.click()")
        await pg.goto(URL, wait_until='networkidle')
        await pg.click('[data-action=new-game]'); await pg.fill('#club-name', 'Live FC'); await pg.click('[data-action=found-club]'); await pg.wait_for_timeout(500)
        await pg.click('[data-action=pack-tear]'); await pg.wait_for_timeout(1800)
        for _ in range(10):
            if await pg.query_selector('[data-action=pack-tear]'): break
            await pg.click('[data-action=pack-next]'); await pg.wait_for_timeout(200)
        await pg.click('[data-action=pack-tear]'); await pg.wait_for_timeout(1800)
        await pg.click('[data-action=pack-flip-all]'); await pg.wait_for_timeout(700)
        await pg.click('[data-action=pack-choose][data-index="0"]'); await pg.click('[data-action=pack-confirm]'); await pg.wait_for_timeout(600)
        for n in range(N):
            for _ in range(60):
                if await pg.locator('[data-action=open-prep]').count() and not await pg.locator('.fullscreen').count(): break
                adv = await pg.evaluate("""()=>{for(const a of ['season-continue','dev-continue','result-continue','close-flow']){if(document.querySelector('[data-action="'+a+'"]'))return a}return null}""")
                if adv: await js(f'[data-action={adv}]')
                else:
                    # offene Postfach-Aufgaben beantworten (erste Wahl), sonst Escape
                    if await pg.locator('[data-action=task-choice]').count(): await js('[data-action=task-choice]')
                    else: await pg.keyboard.press('Escape')
                await pg.wait_for_timeout(150)
            await pg.locator('[data-action=open-prep]').click(); await pg.wait_for_timeout(250)
            await js('[data-action=kickoff]')
            ht = False
            for _ in range(1200):
                if await pg.locator('[data-ht-go]').count() and not ht:
                    ht = True
                    await js('[data-ht-mode=allOut]')
                    await pg.evaluate("(()=>{const o=document.querySelector('[data-ht-out=\"0\"]'),i=document.querySelector('[data-ht-in=\"0\"]'); if(o&&i&&o.options.length>3&&i.options.length>1){o.value=o.options[3].value;i.value=i.options[1].value;}})()")
                    await js('[data-ht-go]')
                if await pg.locator('.scoreboard__min').count() and 'Ende' in (await pg.inner_text('.scoreboard__min')): break
                await js('.scene[data-action=scene-continue]')
                await pg.wait_for_timeout(120)
            await pg.wait_for_timeout(400)
            score = (await pg.inner_text('#sb-score')).replace('\n', ' ')
            hg, ag = [int(x) for x in score.split()[0].split(':')]
            goals = await pg.locator('.tick--goal').count()
            ok = goals == hg + ag
            bad += 0 if ok else 1
            print(n, 'Endstand', score, 'Tor-Einträge', goals, 'OK' if ok else 'FEHLER')
            await js('[data-action=match-report]'); await pg.wait_for_timeout(300)
        print('Seitenfehler:', errs)
    sys.exit(1 if bad or errs else 0)

asyncio.run(main())
