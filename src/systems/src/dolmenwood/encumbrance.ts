//----------------------------------------------------------------------------------------------------------------------
// Dolmenwood - Encumbrance Helpers
//----------------------------------------------------------------------------------------------------------------------

// Models
import type { DolmenwoodInventoryItem } from './models.ts';

//----------------------------------------------------------------------------------------------------------------------

function safeNumber(value : number) : number
{
    if(Number.isFinite(value))
    {
        return value;
    }
    return 0;
}

export function sumItemWeights(items : DolmenwoodInventoryItem[]) : number
{
    return items.reduce((total, item) =>
    {
        return total + Math.max(0, safeNumber(item.weight));
    }, 0);
}

export function computeDerivedEncumbrance(totalItemWeight : number, strengthScore : number) : number
{
    const weight = Math.max(0, safeNumber(totalItemWeight));
    const strength = Math.max(0, safeNumber(strengthScore));
    return Math.max(0, weight - strength);
}

export function calculateDerivedEncumbrance(items : DolmenwoodInventoryItem[], strengthScore : number) : number
{
    return computeDerivedEncumbrance(sumItemWeights(items), strengthScore);
}

//----------------------------------------------------------------------------------------------------------------------
