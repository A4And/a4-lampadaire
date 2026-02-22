/**
 * Extension A4_Lampadaire - MakeCode micro:bit blocks
 */
//% block="A4_Street Light" color=#3399FF icon="\uf0eb" weight=45
namespace A4_Lampadaire {

    // -----------------------------
    // NeoPixel hardware (P1, 10 LEDs)
    // -----------------------------
    const NB_LED = 10
    const PIN_NEOPIXEL = DigitalPin.P1

    let ruban: neopixel.Strip = null

    // Base color (at 100%) stored as 0xRRGGBB
    let couleurBase = 0x000000

    // Stored power in % (0..100). Default: 100%
    let puissancePct = 100

    // Cancellation token: any new lighting command increments it
    let eclairageToken = 0

    function getRuban(): neopixel.Strip {
        if (!ruban) {
            ruban = neopixel.create(PIN_NEOPIXEL, NB_LED, NeoPixelMode.RGB)
            ruban.clear()
            ruban.show()
        }
        return ruban
    }

    function clampPct(v: number): number {
        if (v < 0) return 0
        if (v > 100) return 100
        return v
    }

    // Applies a power (0..100%) to a 0xRRGGBB color
    function scaleRGB(rgb: number, pct: number): number {
        pct = clampPct(pct)
        const r = (rgb >> 16) & 0xFF
        const g = (rgb >> 8) & 0xFF
        const b = rgb & 0xFF
        const rr = Math.idiv(r * pct, 100)
        const gg = Math.idiv(g * pct, 100)
        const bb = Math.idiv(b * pct, 100)
        return neopixel.rgb(rr, gg, bb)
    }

    function appliquerCouleur(pct: number): void {
        const s = getRuban()
        const rgb = scaleRGB(couleurBase, pct)
        s.showColor(rgb)
    }

    function annulerEclairageEnCours(): void {
        eclairageToken++
    }

    // -----------------------------
    // Day / Night (light sensor)
    // -----------------------------
    let seuilJourNuitPct = 50
    let seuilJourNuitLL = 127

    //% block="Seuil jour/nuit $seuil"
    //% seuil.min=0 seuil.max=100 seuil.defl=50
    export function seuilJourNuit(seuil: number): void {
        seuil = clampPct(seuil)
        seuilJourNuitPct = seuil
        seuilJourNuitLL = Math.idiv(seuil * 255, 100)
    }

    //% block="Lire lumière (0 à 100)"
    export function lireLumiere0a100(): number {
        return Math.idiv(input.lightLevel() * 100, 255)
    }

    //% block="Day"
    export function jour(): boolean {
        return input.lightLevel() > seuilJourNuitLL
    }

    //% block="Night"
    export function nuit(): boolean {
        return input.lightLevel() <= seuilJourNuitLL
    }

    // -----------------------------
    // Street light relay (P0)
    // -----------------------------
    //% block="Switch On"
    export function allumerLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 1)
        basic.showNumber(1)
    }

    /**
     * Switch off:
     * - sets P0 to 0
     * - also turns off the LED strip and cancels any running ramp
     */
    //% block="Switch Off"
    export function eteindreLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 0)
        basic.showNumber(0)

        annulerEclairageEnCours()
        couleurBase = 0x000000
        appliquerCouleur(0)
    }

    // -----------------------------
    // NeoPixel lighting (P1)
    // -----------------------------
    export enum ModeEclairage {
        //% block="Off"
        Eteindre = 0,
        //% block="White"
        Blanc = 1,
        //% block="Blue"
        Bleu = 2,
        //% block="Green"
        Vert = 3,
        //% block="Magenta"
        Magenta = 4
    }

    //% block="Light power (0 to 100) $x"
    //% x.min=0 x.max=100 x.defl=100
    export function puissanceEclairage(x: number): void {
        x = clampPct(x)
        puissancePct = x

        // Manual change cancels any running ramp
        annulerEclairageEnCours()

        // Re-apply current color with new power
        appliquerCouleur(puissancePct)
    }

    //% block="Street light $mode"
    //% mode.defl=ModeEclairage.Eteindre
    export function eclairage(mode: ModeEclairage): void {
        // Any manual command cancels a running ramp
        annulerEclairageEnCours()

        switch (mode) {
            case ModeEclairage.Eteindre:
                couleurBase = 0x000000
                appliquerCouleur(0)
                break
            case ModeEclairage.Blanc:
                couleurBase = 0xFFFFFF
                appliquerCouleur(puissancePct)
                break
            case ModeEclairage.Bleu:
                couleurBase = 0x0000FF
                appliquerCouleur(puissancePct)
                break
            case ModeEclairage.Vert:
                couleurBase = 0x00FF00
                appliquerCouleur(puissancePct)
                break
            case ModeEclairage.Magenta:
                couleurBase = 0xFF00FF
                appliquerCouleur(puissancePct)
                break
        }
    }

    // -----------------------------
    // Advanced... : progressive lighting
    // -----------------------------
    export enum CouleurAllumage {
        //% block="Blanc"
        Blanc = 1,
        //% block="Bleu"
        Bleu = 2,
        //% block="Vert"
        Vert = 3,
        //% block="Magenta"
        Magenta = 4
    }

    /**
     * Eclairage progressif (couleur) de (x1) à (x2) % en (t) s
     */
    //% block="Eclairage progressif ($couleur) de $x1 à $x2 % en $t s"
    //% inlineInputMode=inline
    //% x1.min=0 x1.max=100 x1.defl=0
    //% x2.min=0 x2.max=100 x2.defl=100
    //% t.min=0 t.max=60 t.defl=5
    //% advanced=true
    export function eclairageProgressif(couleur: CouleurAllumage, x1: number, x2: number, t: number): void {
        x1 = clampPct(x1)
        x2 = clampPct(x2)
        if (t < 0) t = 0
        else if (t > 60) t = 60

        // Cancel any previous ramp
        annulerEclairageEnCours()
        const myToken = eclairageToken

        // Set target base color (at 100%)
        switch (couleur) {
            case CouleurAllumage.Blanc:   couleurBase = 0xFFFFFF; break
            case CouleurAllumage.Bleu:    couleurBase = 0x0000FF; break
            case CouleurAllumage.Vert:    couleurBase = 0x00FF00; break
            case CouleurAllumage.Magenta: couleurBase = 0xFF00FF; break
        }

        // Immediate
        if (t == 0) {
            puissancePct = x2
            appliquerCouleur(puissancePct)
            return
        }

        // 10 steps / second (max 600 steps)
        const steps = t * 10
        const pauseMs = Math.idiv(t * 1000, steps)

        // Start at x1
        appliquerCouleur(x1)

        for (let i = 0; i <= steps; i++) {
            if (eclairageToken != myToken) return

            // Linear interpolation
            const pct = Math.idiv(x1 * (steps - i) + x2 * i, steps)
            appliquerCouleur(pct)

            if (i < steps) basic.pause(pauseMs)
        }

        // Store final power
        puissancePct = x2
    }
}
