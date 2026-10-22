# =============================================================================
# Browser-Rauchtest: neues Spiel, Starter-Pack, ein Live-Spiel mit Halbzeit-
# Entscheidung, danach Spieltage per Sofort-Anpfiff bis zum Saisonende.
# Aufruf (Repo-Wurzel statisch ausliefern, kein Build nötig):
#   python3 -m http.server 5190 &      # im Repo-Ordner
#   python3 scripts/ui/smoke.py [ausgabeordner] [url] [en]
# Ergebnis: Screenshots im Ausgabeordner, Konsole listet Seitenfehler (muss [] sein).
# =============================================================================
import asyncio, sys, os
from playwright.async_api import async_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/sxi-smoke'
URL = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:5190/'
LOCALE = 'en-US' if len(sys.argv) > 3 and sys.argv[3] == 'en' else 'de-DE'
os.makedirs(OUT, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale=LOCALE)
        pg = await ctx.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.route('**/fonts.g*/**', lambda r: r.abort())  # Google Fonts sind in der Sandbox gesperrt
        async def shot(n, full=False):
            await pg.wait_for_timeout(350); await pg.screenshot(path=f'{OUT}/{n}.png', full_page=full)
        async def click_js(sel):
            await pg.evaluate(f"document.querySelector('{sel}')?.click()")

        await pg.goto(URL, wait_until='networkidle')
        await pg.click('[data-action=new-game]'); await pg.fill('#club-name', 'Smoke FC')
        await pg.click('[data-action=found-club]'); await pg.wait_for_timeout(500)
        await pg.click('[data-action=pack-tear]'); await pg.wait_for_timeout(1800)
        for _ in range(10):
            if await pg.query_selector('[data-action=pack-tear]'): break
            await pg.click('[data-action=pack-next]'); await pg.wait_for_timeout(200)
        await pg.click('[data-action=pack-tear]'); await pg.wait_for_timeout(1800)
        await pg.click('[data-action=pack-flip-all]'); await pg.wait_for_timeout(700)
        await pg.click('[data-action=pack-choose][data-index="0"]')
        await pg.click('[data-action=pack-confirm]'); await pg.wait_for_timeout(600)
        await shot('01_home')

        live_done = False
        season_end = False
        for i in range(220):
            if await pg.locator('.season-end').count():
                season_end = True; await shot('09_season_end'); break
            adv = await pg.evaluate("""() => { for (const a of ['season-continue','dev-continue','result-continue','match-report','close-flow']) { if (document.querySelector('[data-action="'+a+'"]')) return a; } return null; }""")
            if adv:
                await click_js(f'[data-action={adv}]'); await pg.wait_for_timeout(150); continue
            if await pg.locator('[data-action=open-prep]').count() and not await pg.locator('.fullscreen').count():
                await pg.locator('[data-action=open-prep]').click(); await pg.wait_for_timeout(250)
                if not live_done:
                    # Reiter der Spielvorbereitung: Gegner, Taktik, Woche (je ein Screenshot in voller Länge)
                    for tabkey, name in [('opp', '02a_opp'), ('tactics', '02b_tactics'), ('week', '02c_week')]:
                        await click_js(f'[data-action=prep-tab][data-value={tabkey}]'); await pg.wait_for_timeout(250)
                        h = await pg.evaluate("document.querySelector('.fullscreen > .screen').scrollHeight")
                        # Vollbild-Ablauf scrollt in sich: Viewport auf Inhaltshöhe ziehen, dann fotografieren
                        await pg.set_viewport_size({'width': 390, 'height': max(844, h)}); await shot(name)
                        await pg.set_viewport_size({'width': 390, 'height': 844})
                        print('prep tab', tabkey, 'Höhe', h)
                    await click_js('[data-action=prep-tab][data-value=tactics]'); await pg.wait_for_timeout(200)
                    await click_js('[data-action=prep-tab][data-value=week]'); await click_js('[data-action=prep-fold][data-value=plan]'); await pg.wait_for_timeout(150); await click_js('[data-action=set-plan][data-value=setpieces]'); await pg.wait_for_timeout(200); await shot('02d_plan_setpieces')  # plan-setpieces
                    await click_js('[data-action=prep-tab][data-value=tactics]'); await pg.wait_for_timeout(200)
                    await click_js('[data-action=coach-apply]'); await pg.wait_for_timeout(300)  # Co-Trainer-Vorschlag
                    await pg.locator('[data-action=kickoff]').click()
                    for _ in range(500):
                        if await pg.locator('.scene--ht').count(): break
                        await click_js('.scene[data-action=scene-continue]'); await pg.wait_for_timeout(120)
                    await shot('03_halftime')
                    await pg.locator('[data-ht-mode=allOut]').click()
                    await pg.locator('[data-ht-go]').click()
                    for _ in range(500):
                        if await pg.locator('[data-action=match-report]').count(): break
                        await click_js('.scene[data-action=scene-continue]'); await pg.wait_for_timeout(120)
                    await shot('04_fulltime')
                    await click_js('[data-action=match-report]'); await shot('05_report', True)
                    live_done = True
                else:
                    await click_js('[data-action=kickoff-instant]')
                await pg.wait_for_timeout(150); continue
            if await pg.locator('[data-action=sim-day]').count() and not await pg.locator('.fullscreen').count():
                await click_js('[data-action=sim-day]'); await pg.wait_for_timeout(150); continue
            await pg.keyboard.press('Escape')
            if not await pg.locator('.fullscreen').count():
                await pg.locator('[data-action=tab][data-tab=home]').click()
            await pg.wait_for_timeout(150)
        print('live match with halftime:', live_done, '| season end reached:', season_end)
        print('page errors:', errors)
        await b.close()
        sys.exit(1 if errors or not live_done else 0)

asyncio.run(main())
