/*!
figma-squircle 1.1.0 — https://github.com/phamfoo/figma-squircle
MIT License

Copyright (c) 2021 Tien Pham

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/
interface RoundedRectangle {
  topLeftCornerRadius: number
  topRightCornerRadius: number
  bottomRightCornerRadius: number
  bottomLeftCornerRadius: number
  width: number
  height: number
}

interface NormalizedCorner {
  radius: number
  roundingAndSmoothingBudget: number
}

interface NormalizedCorners {
  topLeft: NormalizedCorner
  topRight: NormalizedCorner
  bottomLeft: NormalizedCorner
  bottomRight: NormalizedCorner
}

type Corner = keyof NormalizedCorners

type Side = 'top' | 'left' | 'right' | 'bottom'

interface Adjacent {
  side: Side
  corner: Corner
}

export function distributeAndNormalize({
  topLeftCornerRadius,
  topRightCornerRadius,
  bottomRightCornerRadius,
  bottomLeftCornerRadius,
  width,
  height,
}: RoundedRectangle): NormalizedCorners {
  const roundingAndSmoothingBudgetMap: Record<Corner, number> = {
    topLeft: -1,
    topRight: -1,
    bottomLeft: -1,
    bottomRight: -1,
  }

  const cornerRadiusMap: Record<Corner, number> = {
    topLeft: topLeftCornerRadius,
    topRight: topRightCornerRadius,
    bottomLeft: bottomLeftCornerRadius,
    bottomRight: bottomRightCornerRadius,
  }

  Object.entries(cornerRadiusMap)
    // Let the bigger corners choose first
    .sort(([, radius1], [, radius2]) => {
      return radius2 - radius1
    })
    .forEach(([cornerName, radius]) => {
      const corner = cornerName as Corner
      const adjacents = adjacentsByCorner[corner]

      // Look at the 2 adjacent sides, figure out how much space we can have on both sides,
      // then take the smaller one
      const budget = Math.min(
        ...adjacents.map((adjacent) => {
          const adjacentCornerRadius = cornerRadiusMap[adjacent.corner]
          if (radius === 0 && adjacentCornerRadius === 0) {
            return 0
          }

          const adjacentCornerBudget =
            roundingAndSmoothingBudgetMap[adjacent.corner]

          const sideLength =
            adjacent.side === 'top' || adjacent.side === 'bottom'
              ? width
              : height

          // If the adjacent corner's already been given the rounding and smoothing budget,
          // we'll just take the rest
          if (adjacentCornerBudget >= 0) {
            return sideLength - roundingAndSmoothingBudgetMap[adjacent.corner]
          } else {
            return (radius / (radius + adjacentCornerRadius)) * sideLength
          }
        })
      )

      roundingAndSmoothingBudgetMap[corner] = budget
      cornerRadiusMap[corner] = Math.min(radius, budget)
    })

  return {
    topLeft: {
      radius: cornerRadiusMap.topLeft,
      roundingAndSmoothingBudget: roundingAndSmoothingBudgetMap.topLeft,
    },
    topRight: {
      radius: cornerRadiusMap.topRight,
      roundingAndSmoothingBudget: roundingAndSmoothingBudgetMap.topRight,
    },
    bottomLeft: {
      radius: cornerRadiusMap.bottomLeft,
      roundingAndSmoothingBudget: roundingAndSmoothingBudgetMap.bottomLeft,
    },
    bottomRight: {
      radius: cornerRadiusMap.bottomRight,
      roundingAndSmoothingBudget: roundingAndSmoothingBudgetMap.bottomRight,
    },
  }
}

const adjacentsByCorner: Record<Corner, Array<Adjacent>> = {
  topLeft: [
    {
      corner: 'topRight',
      side: 'top',
    },
    {
      corner: 'bottomLeft',
      side: 'left',
    },
  ],
  topRight: [
    {
      corner: 'topLeft',
      side: 'top',
    },
    {
      corner: 'bottomRight',
      side: 'right',
    },
  ],
  bottomLeft: [
    {
      corner: 'bottomRight',
      side: 'bottom',
    },
    {
      corner: 'topLeft',
      side: 'left',
    },
  ],
  bottomRight: [
    {
      corner: 'bottomLeft',
      side: 'bottom',
    },
    {
      corner: 'topRight',
      side: 'right',
    },
  ],
}
