class Personaje {
    constructor(id, nombre, ciudad, tipo, equipo, nivel = 1, experiencia = 0, escudo = 0, dañoUltimate = 0, umbralUltimate = 150, ultimateDisponible = false) {
        this.id = id;
        this.nombre = nombre;
        this.ciudad = ciudad;
        this.tipo = tipo; // 'superheroe' o 'villano'
        this.nivel = nivel;
        this.experiencia = experiencia;
        this.escudo = escudo;
        this.dañoUltimate = dañoUltimate;
        this.umbralUltimate = umbralUltimate;
        this.ultimateDisponible = ultimateDisponible;
        this.vida = 100 + (this.nivel - 1) * 5;
        if (equipo) this.equipo = equipo;
    }

    // Subir experiencia y nivel, con traspaso de experiencia sobrante
    ganarExperiencia(cantidad) {
        if (this.nivel >= 10) {
            this.experiencia = 100;
            return;
        }
        let totalExp = this.experiencia + cantidad;
        while (totalExp >= 100 && this.nivel < 10) {
            totalExp -= 100;
            this.subirNivel();
        }
        this.experiencia = this.nivel < 10 ? totalExp : 100;
    }

    subirNivel() {
        if (this.nivel < 10) {
            this.nivel++;
            this.vida = 100 + (this.nivel - 1) * 5;
            this.escudo = (this.nivel - 1) * 5;
            this.umbralUltimate = Math.round(this.umbralUltimate * 1.1);
        }
    }

    // Daño de ataques según nivel
    getAtaqueBasico() {
        return 5 + (this.nivel - 1) * 1;
    }
    getAtaqueEspecial() {
        return 30 + (this.nivel - 1) * 10;
    }
    getAtaqueCritico(base) {
        return Math.round(base * 1.5);
    }
    getAtaqueUltimate() {
        return 80 + (this.nivel - 1) * 10;
    }

    // Calcular daño recibido aplicando escudo (excepto ultimate)
    recibirDanio(danio, esUltimate = false) {
        if (!esUltimate && this.escudo > 0) {
            const reduccion = danio * (this.escudo / 100);
            danio = danio - reduccion;
        }
        this.vida -= danio;
        if (this.vida < 0) this.vida = 0;
    }

    // Sumar daño realizado para cargar ultimate
    cargarUltimate(danio) {
        if (this.nivel >= 10 && this.dañoUltimate >= this.umbralUltimate) return;
        this.dañoUltimate += danio;
        if (this.dañoUltimate >= this.umbralUltimate) {
            this.ultimateDisponible = true;
        }
    }

    // Usar ultimate (resetea el contador)
    usarUltimate() {
        if (this.ultimateDisponible) {
            this.dañoUltimate = 0;
            this.ultimateDisponible = false;
            return this.getAtaqueUltimate();
        }
        return 0;
    }
}

class Heroe extends Personaje {
    constructor(id, nombre, ciudad) {
        super(id, nombre, ciudad, 'superheroe');
    }
}

class Villano extends Personaje {
    constructor(id, nombre, ciudad) {
        super(id, nombre, ciudad, 'villano');
    }
}

export { Personaje, Heroe, Villano }; 