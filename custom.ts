/**
 * Extension A4_Lampadaire - Blocs MakeCode micro:bit
 */
//% block="A4_Lampadaire" color=#3399FF icon="\uf0eb" weight=45
namespace A4_Lampadaire {

    // -----------------------------
    // Matériel NeoPixel (P1, 10 LED)
    // -----------------------------
    const NB_LED = 10
    const PIN_NEOPIXEL = DigitalPin.P1

    let ruban: neopixel.Strip = null

    // Couleur de référence (à 100%) mémorisée (0xRRGGBB)
    let couleurBase = 0x000000

    // Puissance mémorisée en % (0..100). Défaut : 100%
    let puissancePct = 100

    // Token d'annulation : chaque nouvel ordre d'éclairage l'incrémente
    let eclairageToken = 0

    function getRuban(): neopixel.Strip {
        if (!ruban) {
            // NeoPixelMode.RGB = "RGB (GRB format)" dans pxt-neopixel (WS2812B classique)
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

    // Applique une puissance (0..100%) à une couleur 0xRRGGBB
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

    // Applique immédiatement la couleurBase avec une puissance donnée
    function appliquerCouleur(pct: number): void {
        const s = getRuban()
        const rgb = scaleRGB(couleurBase, pct)
        s.showColor(rgb)
    }

    function annulerEclairageEnCours(): void {
        eclairageToken++
    }

    // -----------------------------
    // Jour / Nuit (capteur lumière)
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

    //% block="Jour"
    export function jour(): boolean {
        return input.lightLevel() > seuilJourNuitLL
    }

    //% block="Nuit"
    export function nuit(): boolean {
        return input.lightLevel() <= seuilJourNuitLL
    }

    // -----------------------------
    // Lampadaire (sortie P0)
    // -----------------------------
    //% block="Allumer Lampadaire"
    export function allumerLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 1)
        basic.showNumber(1)
    }

    /**
     * Éteindre le lampadaire :
     * - met P0 à 0
     * - coupe aussi le ruban (sinon l'éclairage peut rester actif)
     */
    //% block="Eteindre Lampadaire"
    export function eteindreLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 0)
        basic.showNumber(0)

        // Stoppe toute rampe en cours + éteint le ruban
        annulerEclairageEnCours()
        couleurBase = 0x000000
        appliquerCouleur(0)
    }

    // -----------------------------
    // Eclairage NeoPixel (P1)
    // -----------------------------
    export enum ModeEclairage {
        //% block="Eteindre"
        Eteindre = 0,
        //% block="Blanc"
        Blanc = 1,
        //% block="Bleu"
        Bleu = 2,
        //% block="Vert"
        Vert = 3,
        //% block="Magenta"
        Magenta = 4
    }

    //% block="Puissance éclairage (0 à 100) $niveau"
    //% niveau.min=0 niveau.max=100 niveau.defl=100
    export function puissanceEclairage(niveau: number): void {
        niveau = clampPct(niveau)
        puissancePct = niveau

        // Si un progressif tourne, on l'annule pour éviter les "conflits"
        annulerEclairageEnCours()

        // Réapplique la couleur actuelle avec la nouvelle puissance
        appliquerCouleur(puissancePct)
    }

    //% block="Eclairage $mode"
    //% mode.defl=ModeEclairage.Eteindre
    export function eclairage(mode: ModeEclairage): void {
        // Tout ordre “manuel” annule une rampe en cours
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
    // Avancé... : allumage progressif
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
     * Allumage progressif (couleur) de 0 à (x) % en (t) s
     */
    //% block="Allumage progressif ($couleur) de 0 à $x % en $t s"
    //% inlineInputMode=inline
    //% x.min=0 x.max=100 x.defl=100
    //% t.min=0 t.max=60 t.defl=5
    //% advanced=true
    export function allumageProgressif(couleur: CouleurAllumage, x: number, t: number): void {
        x = clampPct(x)
        if (t < 0) t = 0
        else if (t > 60) t = 60

        // Annule toute rampe précédente
        annulerEclairageEnCours()
        const myToken = eclairageToken

        // Définit la couleur cible (à 100%)
        switch (couleur) {
            case CouleurAllumage.Blanc:   couleurBase = 0xFFFFFF; break
            case CouleurAllumage.Bleu:    couleurBase = 0x0000FF; break
            case CouleurAllumage.Vert:    couleurBase = 0x00FF00; break
            case CouleurAllumage.Magenta: couleurBase = 0xFF00FF; break
        }

        // Cas immédiat
        if (t == 0) {
            puissancePct = x
            appliquerCouleur(puissancePct)
            return
        }

        // 10 pas / seconde (max 600 pas)
        const steps = t * 10
        const pauseMs = Math.idiv(t * 1000, steps)

        for (let i = 0; i <= steps; i++) {
            // Si un autre ordre a été donné, on stoppe
            if (eclairageToken != myToken) return

            const pct = Math.idiv(x * i, steps)
            appliquerCouleur(pct)

            if (i < steps) basic.pause(pauseMs)
        }

        // Mémorise la puissance finale comme puissance courante
        puissancePct = x
    }
}
