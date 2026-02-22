/**
 * Extension A4_Lampadaire - Blocs MakeCode micro:bit
 */
//% block="A4_Lampadaire" color=#3399FF icon="\uf0eb" weight=45
namespace A4_Lampadaire {

    // -----------------------------
    // Matériel NeoPixel (P0, 10 LED)
    // -----------------------------
    const NB_LED = 10
    const PIN_NEOPIXEL = DigitalPin.P0

    // -----------------------------
    // PIR (P1)
    // -----------------------------
    const PIN_PIR = DigitalPin.P1
    let pirInit = false
    function initPIR(): void {
        if (!pirInit) {
            // Stabilise l'entrée si le PIR flotte parfois
            pins.setPull(PIN_PIR, PinPullMode.PullDown)
            pirInit = true
        }
    }

    let ruban: neopixel.Strip = null

    // Couleur de référence (à 100%) mémorisée (0xRRGGBB)
    let couleurBase = 0x000000

    // Puissance mémorisée en % (0..100). Défaut : 100%
    let puissancePct = 100

    // Token d'annulation : chaque nouvel ordre d'éclairage l'incrémente
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
    // PIR : Présence détectée (losange)
    // -----------------------------
    /**
     * Présence détectée : true si le PIR renvoie 1
     */
    //% block="Présence détectée"
    export function presenceDetectee(): boolean {
        initPIR()
        return pins.digitalReadPin(PIN_PIR) == 1
    }

    // -----------------------------
    // Lampadaire = ruban NeoPixel
    // -----------------------------
    //% block="Allumer Lampadaire"
    export function allumerLampadaire(): void {
        // Si aucune couleur n'a été définie, on met blanc par défaut
        if (couleurBase == 0x000000) couleurBase = 0xFFFFFF

        // Annule une rampe éventuelle, puis applique la puissance courante
        annulerEclairageEnCours()
        appliquerCouleur(puissancePct)

        basic.showNumber(1)
    }

    /**
     * Éteindre le lampadaire :
     * - annule toute rampe en cours
     * - éteint le ruban
     */
    //% block="Eteindre Lampadaire"
    export function eteindreLampadaire(): void {
        annulerEclairageEnCours()
        couleurBase = 0x000000
        appliquerCouleur(0)

        basic.showNumber(0)
    }

    // -----------------------------
    // Eclairage NeoPixel
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

        // Un réglage manuel annule une rampe en cours
        annulerEclairageEnCours()

        // Réapplique la couleur courante avec la nouvelle puissance
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
    // Avancé... : éclairage progressif
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
     * Permet allumage progressif (x1<x2) ou extinction progressive (x1>x2)
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
            puissancePct = x2
            appliquerCouleur(puissancePct)
            return
        }

        // 10 pas / seconde (max 600 pas)
        const steps = t * 10
        const pauseMs = Math.idiv(t * 1000, steps)

        // Applique dès le départ x1
        appliquerCouleur(x1)

        for (let i = 0; i <= steps; i++) {
            if (eclairageToken != myToken) return

            // interpolation linéaire : pct = (x1*(steps-i) + x2*i)/steps
            const pct = Math.idiv(x1 * (steps - i) + x2 * i, steps)
            appliquerCouleur(pct)

            if (i < steps) basic.pause(pauseMs)
        }

        // Mémorise la puissance finale
        puissancePct = x2
    }
}
