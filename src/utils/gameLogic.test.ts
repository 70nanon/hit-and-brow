import { describe, it, expect } from 'vitest'
import {
  generateRandomSecret,
  validateGuess,
  checkGuess,
  isGameClear,
  defaultConfig,
} from './gameLogic'

describe('generateRandomSecret', () => {
  it('指定した桁数の数字を生成する', () => {
    const secret = generateRandomSecret({ digits: 4, allowDuplicate: false })
    expect(secret).toHaveLength(4)
    expect(/^\d+$/.test(secret)).toBe(true) // 数字のみ
  })

  it('重複なしの場合、すべての数字がユニーク', () => {
    const secret = generateRandomSecret({ digits: 4, allowDuplicate: false })
    const digits = new Set(secret.split(''))
    expect(digits.size).toBe(4)
  })

  it('重複ありの場合、重複する可能性がある', () => {
    // 10回生成して、少なくとも1回は重複があるはず（確率的）
    let hasDuplicate = false
    for (let i = 0; i < 10; i++) {
      const secret = generateRandomSecret({ digits: 4, allowDuplicate: true })
      const digits = new Set(secret.split(''))
      if (digits.size < 4) {
        hasDuplicate = true
        break
      }
    }
    // この確率テストは必ず通るわけではないが、参考として
    expect(hasDuplicate).toBe(true)
  })

  it('3桁の数字を生成できる', () => {
    const secret = generateRandomSecret({ digits: 3, allowDuplicate: false })
    expect(secret).toHaveLength(3)
  })

  it('重複なしで10桁を超えるとエラー', () => {
    expect(() => generateRandomSecret({ digits: 11, allowDuplicate: false }))
      .toThrow('重複なしの場合、桁数は10以下である必要があります')
  })
})

describe('validateGuess', () => {
  it('正しい入力はエラーなし', () => {
    const error = validateGuess('1234', defaultConfig)
    expect(error).toBeNull()
  })

  it('桁数が違う場合はエラー', () => {
    const error = validateGuess('123', defaultConfig)
    expect(error).toBe('4桁の数字を入力してください')
  })

  it('数字以外が含まれる場合はエラー', () => {
    const error = validateGuess('12a4', defaultConfig)
    expect(error).toBe('数字のみを入力してください')
  })

  it('重複不可で重複がある場合はエラー', () => {
    const error = validateGuess('1123', { digits: 4, allowDuplicate: false })
    expect(error).toBe('重複しない数字を入力してください')
  })

  it('重複可の場合、重複してもエラーなし', () => {
    const error = validateGuess('1111', { digits: 4, allowDuplicate: true })
    expect(error).toBeNull()
  })
})

describe('checkGuess', () => {
  it('完全一致の場合、すべてヒット', () => {
    const result = checkGuess('1234', '1234')
    expect(result).toEqual({ hit: 4, blow: 0 })
  })

  it('数字は合っているが位置が全て違う場合、すべてブロー', () => {
    const result = checkGuess('1234', '4321')
    expect(result).toEqual({ hit: 0, blow: 4 })
  })

  it('一部一致の場合、ヒットとブローが混在', () => {
    const result = checkGuess('1234', '1243')
    expect(result).toEqual({ hit: 2, blow: 2 })
  })

  it('全く一致しない場合、ヒットもブローも0', () => {
    const result = checkGuess('1234', '5678')
    expect(result).toEqual({ hit: 0, blow: 0 })
  })

  it('1つだけヒットの場合', () => {
    const result = checkGuess('1234', '1567')
    expect(result).toEqual({ hit: 1, blow: 0 })
  })

  it('1つだけブローの場合', () => {
    const result = checkGuess('1234', '5672')
    expect(result).toEqual({ hit: 0, blow: 1 })
  })
})

describe('isGameClear', () => {
  it('全てヒットの場合、クリア', () => {
    const result = { hit: 4, blow: 0 }
    expect(isGameClear(result, defaultConfig)).toBe(true)
  })

  it('ヒットが桁数未満の場合、クリアではない', () => {
    const result = { hit: 3, blow: 0 }
    expect(isGameClear(result, defaultConfig)).toBe(false)
  })

  it('ブローのみの場合、クリアではない', () => {
    const result = { hit: 0, blow: 4 }
    expect(isGameClear(result, defaultConfig)).toBe(false)
  })

  it('3桁設定でも正しく判定', () => {
    const result = { hit: 3, blow: 0 }
    expect(isGameClear(result, { digits: 3, allowDuplicate: false })).toBe(true)
  })
})
