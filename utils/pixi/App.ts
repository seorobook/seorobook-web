import * as PIXI from 'pixi.js'
import { Layer, LibraryData, ColliderMap, TilePoint, Room } from './types'
import { sprites, Collider } from './spritesheet/spritesheet'

PIXI.TextureStyle.defaultOptions.scaleMode = 'nearest'

export class App {
    protected app: PIXI.Application = new PIXI.Application()
    protected initialized: boolean = false
    protected layers: { [key in Layer]: PIXI.Container } = {
        floor: new PIXI.Container(),
        above_floor: new PIXI.Container(),
        object: new PIXI.Container(),
    }
    public currentRoomIndex: number = 0    
    public libraryData: LibraryData
    protected collidersFromSpritesMap: ColliderMap = {}
    protected backgroundColor: number = 0x0F0F0F

    constructor(libraryData: LibraryData) {
        this.libraryData = JSON.parse(JSON.stringify(libraryData))
    }

    public async init() {
        const container = document.getElementById('app-container')
        if (!container) {
            throw new Error('Container not found')
        }

        await this.app.init({
            resizeTo: container,
            backgroundColor: this.backgroundColor,
            roundPixels: true,
        })
        this.initialized = true

        this.app.stage.addChild(this.layers.floor)
        this.app.stage.addChild(this.layers.above_floor)
        this.app.stage.addChild(this.layers.object)
    }

    protected async loadRoomFromData(room: Room) {
        this.layers.floor.removeChildren()
        this.layers.above_floor.removeChildren()
        this.layers.object.removeChildren()
        this.collidersFromSpritesMap = {}

        const tilemap = room?.tilemap
        if (!tilemap || typeof tilemap !== 'object') return

        for (const [tilePoint, tileData] of Object.entries(tilemap)) {
            const [x, y] = tilePoint.split(',').map(Number)
            if (Number.isNaN(x) || Number.isNaN(y)) continue

            const floor = tileData?.floor
            const above_floor = tileData?.above_floor
            const object = tileData?.object

            if (floor) await this.placeTileFromJson(x, y, 'floor', floor)
            if (above_floor) await this.placeTileFromJson(x, y, 'above_floor', above_floor)
            if (object) await this.placeTileFromJson(x, y, 'object', object)
        }

        this.sortObjectsByY()
    }

    protected async loadRoom(index: number) {
        const room = this.libraryData?.rooms?.[index]
        if (!room) return
        await this.loadRoomFromData(room)
    }

    /** 오브젝트 레이어: 스프라이트 대신 32x32 채운 사각형 + 아웃라인 (기능 우선, 디자인 최소) */
    private createObjectPlaceholder = (x: number, y: number): PIXI.Graphics => {
        const size = 32
        const g = new PIXI.Graphics()
        g.rect(0, 0, size, size)
        g.fill(0x3a3a3a)
        g.stroke({ width: 1, color: 0x6a6a6a })
        g.position.set(x * size, y * size)
        return g
    }

    private placeTileFromJson = async (x: number, y: number, layer: Layer, tileName: string) => {
        const screenCoordinates = this.convertTileToScreenCoordinates(x, y)

        if (layer === 'object') {
            const placeholder = this.createObjectPlaceholder(x, y)
            this.layers.object.addChild(placeholder)
            const key = `${x}, ${y}` as TilePoint
            this.collidersFromSpritesMap[key] = true
            return
        }

        try {
            const { sprite, data } = await sprites.getSpriteForTileJSON(tileName)
            sprite.position.set(screenCoordinates.x, screenCoordinates.y)
            this.layers[layer].addChild(sprite)
            if (data?.colliders) {
                data.colliders.forEach((collider) => {
                    const colliderCoordinates = this.getTileCoordinatesOfCollider(collider, sprite)
                    const key = `${colliderCoordinates.x}, ${colliderCoordinates.y}` as TilePoint
                    this.collidersFromSpritesMap[key] = true
                })
            }
        } catch {
            // 스프라이트 로드 실패 시 해당 타일만 스킵 (방 전체 크래시 방지)
        }
    }

    protected getTileCoordinatesOfCollider = (collider: Collider, sprite: PIXI.Sprite) => {
        const topLeftX = sprite.x - sprite.width * sprite.anchor.x
        const topLeftY = sprite.y - sprite.height * sprite.anchor.y

        const gridCoordinates = this.convertScreenToTileCoordinates(topLeftX, topLeftY)

        return {
            x: gridCoordinates.x + collider.x,
            y: gridCoordinates.y + collider.y,
        }
    }

    public getApp = () => {
        if (!this.initialized) {
            throw new Error('App not initialized')
        }

        return this.app
    }

    public convertScreenToTileCoordinates = (x: number, y: number) => {
        const tileSize = 32
        return {
            x: Math.floor(x / tileSize),
            y: Math.floor(y / tileSize),
        }
    }

    public convertTileToScreenCoordinates = (x: number, y: number) => {
        const tileSize = 32
        return {
            x: x * tileSize,
            y: y * tileSize,
        }
    }

    public sortObjectsByY = () => {
        this.layers.object.children.forEach((child) => {
            child.zIndex = this.getZIndex(child)
        })
    }

    public getZIndex = (child: PIXI.ContainerChild) => {
        return child.y + 32
    }

    public destroy() {
        if (this.initialized) {
            this.app.destroy()
        }
    }
}