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

    // Puissance mémorisée en % (0..100). Défaut : 100%
    let puissancePct = 100

    function getRuban(): neopixel.Strip {
        if (!ruban) {
            ruban = neopixel.create(PIN_NEOPIXEL, NB_LED, NeoPixelMode.RGB)
            ruban.setBrightness(Math.idiv(puissancePct * 255, 100))
            ruban.clear()
            ruban.show()
        }
        return ruban
    }

    // -----------------------------
    // Jour / Nuit (capteur lumière)
    // -----------------------------
    // Seuil mémorisé en % (0..100)
    let seuilJourNuitPct = 50
    // Seuil mémorisé en "light level" micro:bit (0..255)
    let seuilJourNuitLL = 127

    /**
     * Seuil jour/nuit (0..100) : 0 = très sombre, 100 = très lumineux.
     * La valeur choisie est mémorisée et devient le seuil de référence.
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
     * Jour : true si la lumière ambiante dépasse le seuil mémorisé
     */
    //% block="Jour"
    export function jour(): boolean {
        return input.lightLevel() > seuilJourNuitLL
    }

    /**
     * Nuit : true si la lumière ambiante est inférieure ou égale au seuil mémorisé
     */
    //% block="Nuit"
    export function nuit(): boolean {
        return input.lightLevel() <= seuilJourNuitLL
    }

    // -----------------------------
    // Lampadaire (sortie P0)
    // -----------------------------
    /**
     * Allumer le lampadaire : active P0 et affiche 1
     */
    //% block="Allumer Lampadaire"
    export function allumerLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 1)
        basic.showNumber(1)
    }

    /**
     * Éteindre le lampadaire : désactive P0 et affiche 0
     */
    //% block="Eteindre Lampadaire"
    export function eteindreLampadaire(): void {
        pins.digitalWritePin(DigitalPin.P0, 0)
        basic.showNumber(0)
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

    /**
     * Puissance éclairage (0 à 100)
     */
    //% block="Puissance éclairage (0 à 100) $niveau"
    //% niveau.min=0 niveau.max=100 niveau.defl=100
    export function puissanceEclairage(niveau: number): void {
        if (niveau < 0) niveau = 0
        else if (niveau > 100) niveau = 100

        puissancePct = niveau

        // Applique immédiatement si le ruban existe déjà
        if (ruban) {
            ruban.setBrightness(Math.idiv(puissancePct * 255, 100))
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
        s.setBrightness(Math.idiv(puissancePct * 255, 100))

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
        // Bornage
        if (x < 0) x = 0
        else if (x > 100) x = 100
        if (t < 0) t = 0
        else if (t > 60) t = 60

        const s = getRuban()

        // Choix couleur
        let col = NeoPixelColors.White
        switch (couleur) {
            case CouleurAllumage.Blanc:
                col = NeoPixelColors.White
                break
            case CouleurAllumage.Bleu:
                col = NeoPixelColors.Blue
                break
            case CouleurAllumage.Vert:
                col = NeoPixelColors.Green
                break
            case CouleurAllumage.Magenta:
                col = neopixel.rgb(255, 0, 255)
                break
        }

        const cible255 = Math.idiv(x * 255, 100)

        // Charge la couleur et démarre à 0
        s.setBrightness(0)
        s.showColor(col) // brightness=0 => éteint

        // Si t = 0 : application directe
        if (t == 0) {
            puissancePct = x
            s.setBrightness(cible255)
            s.show()
            return
        }

        // Rampe : 10 mises à jour par seconde (max 600 étapes pour 60s)
        const steps = t * 10
        const pauseMs = Math.idiv(t * 1000, steps)

        for (let i = 0; i <= steps; i++) {
            const b = Math.idiv(cible255 * i, steps)
            s.setBrightness(b)
            s.show()
            if (i < steps) basic.pause(pauseMs)
        }

        // Mémorise la puissance finale pour les autres blocs
        puissancePct = x
    }
}
