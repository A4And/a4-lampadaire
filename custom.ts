/**
 * Extension A4_Lampadaire - Blocs MakeCode micro:bit
 */
//% block="A4_Lampadaire" color=#4DA3FF icon="\uf0eb" weight=45
namespace A4_Lampadaire {

    // --- Réglages matériels ---
    const NB_LED = 10
    const PIN_NEOPIXEL = DigitalPin.P1

    // Ruban NeoPixel (initialisé à la première utilisation)
    let ruban: neopixel.Strip = null

    // Luminosité mémorisée en % (0..100). Défaut : 100%
    let luminositePct = 100

    function getRuban(): neopixel.Strip {
        if (!ruban) {
            ruban = neopixel.create(PIN_NEOPIXEL, NB_LED, NeoPixelMode.RGB)
            ruban.clear()
            ruban.show()
            // Applique la luminosité mémorisée dès la création
            ruban.setBrightness(Math.idiv(luminositePct * 255, 100))
        }
        return ruban
    }

    // --- Jour / Nuit ---
    let seuilJourNuitPct = 50
    let seuilJourNuitLL = 127

    /**
     * Seuil jour/nuit (0..100)
     */
    //% block="Seuil jour/nuit $seuil"
    //% seuil.min=0 seuil.max=100 seuil.defl=50
    export function seuilJourNuit(seuil: number): void {
        if (seuil < 0) seuil = 0
        else if (seuil > 100) seuil = 100

        seuilJourNuitPct = seuil
        seuilJourNuitLL = Math.idiv(seuil * 255, 100)
    }

    /**
     * Lire le niveau lumineux ambiant (0..100)
     */
    //% block="Lire lumière (0 à 100)"
    export function lireLumiere0a100(): number {
        return Math.idiv(input.lightLevel() * 100, 255)
    }

    /**
     * Jour
     */
    //% block="Jour"
    export function jour(): boolean {
        return input.lightLevel() > seuilJourNuitLL
    }

    /**
     * Nuit
     */
    //% block="Nuit"
    export function nuit(): boolean {
        return input.lightLevel() <= seuilJourNuitLL
    }

    // --- Lampadaire (P0) ---
    /**
     * Allumer Lampadaire (P0=1) + affiche 1
     */
    //% block="Allumer Lampadaire"
    export function allumerLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 1)
        basic.showNumber(1)
    }

    /**
     * Eteindre Lampadaire (P0=0) + affiche 0
     */
    //% block="Eteindre Lampadaire"
    export function eteindreLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 0)
        basic.showNumber(0)
    }

    // --- NeoPixel (P1) ---
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

    /**
     * Luminosité ruban (0..100)
     */
    //% block="Luminosité ruban (0 à 100) $niveau"
    //% niveau.min=0 niveau.max=100 niveau.defl=100
    export function luminositeRuban(niveau: number): void {
        if (niveau < 0) niveau = 0
        else if (niveau > 100) niveau = 100

        luminositePct = niveau

        // Si le ruban existe déjà, applique immédiatement
        if (ruban) {
            ruban.setBrightness(Math.idiv(luminositePct * 255, 100))
            ruban.show()
        }
    }

    /**
     * Eclairage (liste déroulante)
     */
    //% block="Eclairage $mode"
    //% mode.defl=ModeEclairage.Eteindre
    export function eclairage(mode: ModeEclairage): void {
        const s = getRuban()

        // Réapplique la luminosité mémorisée au cas où
        s.setBrightness(Math.idiv(luminositePct * 255, 100))

        switch (mode) {
            case ModeEclairage.Eteindre:
                s.clear()
                s.show()
                break

            case ModeEclairage.Blanc:
                s.showColor(NeoPixelColors.White)
                break

            case ModeEclairage.Bleu:
                s.showColor(NeoPixelColors.Blue)
                break

            case ModeEclairage.Vert:
                s.showColor(NeoPixelColors.Green)
                break

            case ModeEclairage.Magenta:
                s.showColor(neopixel.rgb(255, 0, 255))
                break
        }
    }
}
