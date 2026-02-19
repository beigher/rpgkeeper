<template>
    <div class="sheet p-3">
        <div class="sheet-layout">
            <div class="portrait-rail">
                <div class="portrait-wrap dw-card">
                    <img
                        v-if="portraitUrl && !portraitLoadError"
                        :src="portraitUrl"
                        alt="Character portrait"
                        class="portrait-thumb"
                        @error="portraitLoadError = true"
                    >
                    <div v-else class="portrait-placeholder">
                        No portrait
                    </div>
                </div>
            </div>

            <div class="sheet-content">
                <div class="d-flex flex-wrap gap-3 align-items-start mb-3 header-bar">
                    <div class="middle-header-col">
                        <div class="middle-header-content dw-card">
                            <h3 class="m-0">
                                {{ characterName }}
                            </h3>
                            <div class="small text-muted">
                                <div>
                                    HP: <strong>{{ toNumber(details.hpCurrent) }} / {{ toNumber(details.hpMax) }} ({{ hpPercent }})</strong>
                                </div>
                                <BProgress class="mt-1 mb-1" height="6px">
                                    <BProgressBar :value="hpPercentValue" />
                                </BProgress>
                                <div>
                                    <span v-if="dirty" class="badge bg-warning text-dark me-2">● Unsaved</span>
                                    <span v-else class="badge bg-success me-2">✓ Saved</span>
                                    <span v-if="saving" class="ms-1">Saving…</span>
                                    <span v-else-if="lastSavedAt" class="ms-1">Last saved: {{ lastSavedAt }}</span>
                                </div>
                            </div>

                            <div class="d-flex gap-1 mt-2 portrait-input-row">
                                <BFormInput
                                    v-model="portraitUrl"
                                    placeholder="Portrait URL"
                                    size="sm"
                                />
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary"
                                    :disabled="!portraitUrl"
                                    @click="clearPortrait"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <RpgkCard title="Abilities" class="mt-3 dw-card">
                            <div class="d-flex justify-content-end mb-2">
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary"
                                    @click="openAbilitiesModal"
                                >
                                    Edit
                                </button>
                            </div>

                            <BRow class="g-2">
                                <BCol v-for="ability in abilityList" :key="ability.key" sm="6" md="6" class="mb-2">
                                    <div class="ability-tile">
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="fw-semibold">
                                                {{ ability.label }}
                                            </div>
                                            <div class="ms-auto d-flex gap-2 align-items-center">
                                                <span class="badge bg-light text-dark">
                                                    Mod: {{ abilityMod(ability.key) }}
                                                </span>
                                                <button
                                                    type="button"
                                                    class="btn btn-sm btn-outline-secondary"
                                                    @click="rollD20(abilityModNumber(ability.key), ability.label)"
                                                >
                                                    Roll
                                                </button>
                                            </div>
                                        </div>

                                        <div class="small text-muted">
                                            Score: <strong>{{ toNumber(details.abilities?.[ability.key]?.score) }}</strong>
                                        </div>
                                    </div>
                                </BCol>
                            </BRow>

                            <div
                                v-if="showAbilitiesModal"
                                class="dw-modal-backdrop"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="abilities-modal-title"
                                @click.self="cancelAbilitiesModal"
                            >
                                <div class="dw-modal">
                                    <div class="dw-modal-header">
                                        <h5 id="abilities-modal-title" class="m-0">
                                            Edit Characteristics
                                        </h5>
                                    </div>
                                    <div class="dw-modal-body">
                                        <BRow class="g-2">
                                            <BCol v-for="ability in abilityList" :key="`edit-${ ability.key }`" cols="6">
                                                <BFormGroup :label="ability.label">
                                                    <BFormInput v-model.number="abilityDraft[ability.key]" type="number" />
                                                </BFormGroup>
                                            </BCol>
                                        </BRow>
                                    </div>
                                    <div class="dw-modal-footer">
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-secondary"
                                            @click="cancelAbilitiesModal"
                                        >
                                            Cancel
                                        </button>
                                        <button type="button" class="btn btn-sm btn-primary" @click="saveAbilitiesModal">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </RpgkCard>
                    </div>

                    <div class="d-flex flex-column align-items-end header-rolls-column">
                        <div class="d-flex gap-2 align-items-center mb-2 w-100 header-actions-row">
                            <BFormInput v-model="rollExpr" class="roll-input" placeholder="1d20 + 2" size="sm" />
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-primary"
                                @click="roll(rollExpr)"
                            >
                                Roll
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm btn-primary"
                                :disabled="!dirty || saving"
                                @click="saveNow"
                            >
                                Save
                            </button>
                        </div>

                        <div class="roll-results-panel dw-card">
                            <div class="d-flex align-items-center roll-results-header">
                                <strong>Roll Results</strong>
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary ms-auto"
                                    :disabled="rollLog.length === 0"
                                    @click="clearRollLog"
                                >
                                    Clear
                                </button>
                            </div>
                            <div class="roll-results-body">
                                <div v-if="rollLog.length === 0" class="small text-muted">
                                    No rolls yet.
                                </div>
                                <div v-else class="roll-results-list">
                                    <div v-for="(entry, index) in rollLog" :key="index" class="roll-result-entry small">
                                        <div class="d-flex">
                                            <span class="text-muted">{{ entry.timestamp }}</span>
                                            <span class="ms-2">{{ entry.rollType }}: {{ entry.label }}</span>
                                            <span v-if="entry.passed !== null" class="ms-auto" :class="entry.passed ? 'text-success' : 'text-danger'">
                                                <strong>{{ entry.passed ? 'PASS' : 'FAIL' }}</strong>
                                            </span>
                                        </div>
                                        <div>
                                            {{ entry.formula }} => d20({{ entry.die }}) + {{ entry.bonus }} = {{ entry.total }}
                                            <span v-if="entry.target !== null">
                                                vs {{ entry.target }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <BRow class="g-3 mb-3">
                    <BCol cols="12" lg="6">
                        <RpgkCard title="Identity" class="dw-card">
                            <BRow class="g-2">
                                <BCol cols="12" md="6">
                                    <BFormGroup label="Class">
                                        <BFormInput v-model="details.identity.className" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="12" md="6">
                                    <BFormGroup label="Race">
                                        <BFormInput v-model="details.identity.race" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="12" md="6">
                                    <BFormGroup label="Alignment">
                                        <BFormInput v-model="details.identity.alignment" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="12" md="6">
                                    <BFormGroup label="Deity">
                                        <BFormInput v-model="details.identity.deity" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="12">
                                    <BFormGroup label="Background">
                                        <BFormInput v-model="details.identity.background" />
                                    </BFormGroup>
                                </BCol>
                            </BRow>
                        </RpgkCard>

                        <RpgkCard title="Advancement" class="mt-3 dw-card">
                            <BRow class="g-2">
                                <BCol cols="4">
                                    <BFormGroup label="Level">
                                        <BFormInput v-model.number="details.advancement.level" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="4">
                                    <BFormGroup label="XP">
                                        <BFormInput v-model.number="details.advancement.xp" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="4">
                                    <BFormGroup label="Next">
                                        <BFormInput v-model.number="details.advancement.nextLevel" type="number" />
                                    </BFormGroup>
                                </BCol>
                            </BRow>
                        </RpgkCard>
                    </BCol>

                    <BCol cols="12" lg="6">
                        <RpgkCard title="Combat" class="dw-card">
                            <BRow class="g-2">
                                <BCol cols="6">
                                    <BFormGroup label="HP (Current)">
                                        <BFormInput v-model.number="details.hpCurrent" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="6">
                                    <BFormGroup label="HP (Max)">
                                        <BFormInput v-model.number="details.hpMax" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="6">
                                    <BFormGroup label="AC">
                                        <BFormInput v-model.number="details.ac" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="6">
                                    <BFormGroup label="Attack Bonus">
                                        <BFormInput v-model.number="details.attack" type="number" />
                                    </BFormGroup>
                                </BCol>
                            </BRow>

                            <div class="small text-muted mt-2">
                                <span class="me-2">HP %: <strong>{{ hpPercent }}</strong></span>
                                <span>Attack roll: <strong>d20 + {{ details.attack }}</strong></span>
                            </div>
                        </RpgkCard>
                    </BCol>
                </BRow>

                <BRow class="g-3 mt-0">
                    <BCol cols="12" lg="6">
                        <RpgkCard title="Save Targets" class="dw-card">
                            <div class="d-flex gap-3 align-items-start">
                                <div class="flex-grow-1 save-targets-grid">
                                    <div v-for="save in saveList" :key="save.key" class="save-target-item">
                                        <div class="mb-2">
                                            <BFormGroup :label="save.label">
                                                <div class="d-flex gap-2">
                                                    <BFormInput v-model.number="details.saves[save.key]" type="number" />
                                                    <button
                                                        type="button"
                                                        class="btn btn-sm btn-outline-secondary"
                                                        @click="rollSaveTarget(save.key)"
                                                    >
                                                        Roll
                                                    </button>
                                                </div>
                                            </BFormGroup>
                                        </div>
                                    </div>
                                </div>

                                <div class="ms-auto mr-column">
                                    <BFormGroup label="Save Bonus">
                                        <BFormInput
                                            v-model.number="saveBonus"
                                            type="number"
                                            class="mr-input"
                                        />
                                    </BFormGroup>
                                    <BFormGroup label="Magic Resistance">
                                        <BFormInput
                                            v-model.number="details.saves.resistance"
                                            type="number"
                                            class="mr-input"
                                        />
                                    </BFormGroup>
                                </div>
                            </div>
                        </RpgkCard>

                        <RpgkCard title="Movement" class="mt-3 dw-card">
                            <BRow class="g-2">
                                <BCol cols="12">
                                    <BFormGroup label="Speed (ft/round)">
                                        <BFormInput v-model.number="details.movement.speedRoundFt" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="12">
                                    <BFormGroup label="Exploring (ft/turn)">
                                        <BFormInput v-model.number="details.movement.exploringTurnFt" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="12">
                                    <BFormGroup label="Overland (pts/day)">
                                        <BFormInput v-model.number="details.movement.overlandPtsDay" type="number" />
                                    </BFormGroup>
                                </BCol>
                            </BRow>
                        </RpgkCard>
                    </BCol>

                    <BCol cols="12" lg="6">
                        <RpgkCard title="Skills" class="dw-card">
                            <BRow class="g-2">
                                <BCol cols="6">
                                    <BFormGroup label="Listen">
                                        <BFormInput v-model.number="details.skills.listen" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="6">
                                    <BFormGroup label="Search">
                                        <BFormInput v-model.number="details.skills.search" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="6">
                                    <BFormGroup label="Survival">
                                        <BFormInput v-model.number="details.skills.survival" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="6">
                                    <BFormGroup label="Modifier">
                                        <BFormInput v-model.number="details.skills.modifier" type="number" />
                                    </BFormGroup>
                                </BCol>
                            </BRow>
                        </RpgkCard>

                        <RpgkCard title="Inventory" class="mt-3 dw-card">
                            <BFormGroup label="Gear (free text)">
                                <BFormTextarea v-model="details.inventory.gearText" rows="6" />
                            </BFormGroup>

                            <div class="d-flex align-items-center mb-2">
                                <h6 class="m-0">
                                    Item Weights
                                </h6>
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary ms-auto"
                                    @click="addInventoryItem"
                                >
                                    Add Item
                                </button>
                            </div>

                            <div v-if="Array.isArray(details.inventory.items) && details.inventory.items.length > 0">
                                <BRow
                                    v-for="(item, index) in details.inventory.items"
                                    :key="index"
                                    class="g-2 mb-1 align-items-end"
                                >
                                    <BCol cols="8">
                                        <BFormGroup label="Item">
                                            <BFormInput v-model="item.name" />
                                        </BFormGroup>
                                    </BCol>
                                    <BCol cols="3">
                                        <BFormGroup label="Weight">
                                            <BFormInput v-model.number="item.weight" type="number" min="0" step="0.1" />
                                        </BFormGroup>
                                    </BCol>
                                    <BCol cols="1">
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-danger w-100"
                                            @click="removeInventoryItem(index)"
                                        >
                                            ×
                                        </button>
                                    </BCol>
                                </BRow>
                            </div>

                            <div v-else class="small text-muted mb-2">
                                No weighted items yet.
                            </div>

                            <div class="small text-muted mb-2">
                                Item weight total: <strong>{{ itemWeightTotal }}</strong>
                            </div>
                            <div class="small text-muted mb-2">
                                Strength score: <strong>{{ toNumber(details.abilities?.str?.score) }}</strong>
                            </div>
                            <div class="small text-muted mb-2">
                                Derived encumbrance: <strong>{{ derivedEncumbrance }}</strong>
                            </div>

                            <div class="small text-muted mb-2">
                                Total coins: <strong>{{ coinTotal }}</strong> (cp+sp+gp+pell)
                            </div>

                            <BRow class="g-2">
                                <BCol cols="6">
                                    <BFormGroup label="Copper (cp)">
                                        <BFormInput v-model.number="details.inventory.coins.cp" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="6">
                                    <BFormGroup label="Silver (sp)">
                                        <BFormInput v-model.number="details.inventory.coins.sp" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="6">
                                    <BFormGroup label="Gold (gp)">
                                        <BFormInput v-model.number="details.inventory.coins.gp" type="number" />
                                    </BFormGroup>
                                </BCol>
                                <BCol cols="6">
                                    <BFormGroup label="Pellucidium">
                                        <BFormInput v-model.number="details.inventory.coins.pell" type="number" />
                                    </BFormGroup>
                                </BCol>
                            </BRow>
                        </RpgkCard>
                    </BCol>
                </BRow>

                <RpgkCard title="Notes" class="mt-3 dw-card">
                    <BFormTextarea
                        v-model="details.notes"
                        rows="6"
                        placeholder="Session notes, NPCs, hooks, reminders…"
                    />
                </RpgkCard>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ===== Subtle contrast bump for dark UI (component-only) ===== */

/* Muted/help text: slightly brighter + less blue-gray */
:deep(.text-muted) {
    color: #a8b3c2 !important;
    /* soft slate */
    opacity: 1 !important;
}

/* Field labels: brighter + a little weight */
:deep(.form-label),
:deep(label) {
    color: #d7dde6;
    /* near-light */
    font-weight: 600;
    letter-spacing: 0.2px;
}

/* Small labels still readable */
:deep(.small),
:deep(.form-label.small),
:deep(.small.form-label) {
    color: #b9c3d1 !important;
}

/* Card/section borders: clearer but not harsh */
:deep(.border),
:deep(.rounded),
:deep(.card),
:deep(.rpgk-card) {
    border-color: rgba(255, 255, 255, 0.10) !important;
}

/* Inputs: tiny lift in background + clearer border */
:deep(.form-control),
:deep(.form-select),
:deep(input),
:deep(textarea),
:deep(select) {
    background-color: rgba(255, 255, 255, 0.03) !important;
    color: #eef2f7 !important;
    border-color: rgba(255, 255, 255, 0.16) !important;
}

/* Focus: more obvious, still tasteful */
:deep(.form-control:focus),
:deep(.form-select:focus),
:deep(input:focus),
:deep(textarea:focus),
:deep(select:focus) {
    border-color: rgba(255, 193, 7, 0.55) !important;
    /* warm accent */
    box-shadow: 0 0 0 0.18rem rgba(255, 193, 7, 0.18) !important;
    outline: none !important;
}

/* Placeholder text: slightly brighter */
:deep(.form-control::placeholder),
:deep(input::placeholder),
:deep(textarea::placeholder) {
    color: rgba(240, 245, 255, 0.45) !important;
    opacity: 1;
}

.dw-card,
:deep(.dw-card) {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
}

:deep(.dw-card .card-body) {
    padding: 12px 14px;
}

/* Keep Bootstrap row gutters from drawing negative-margin tick marks at card edges */
:deep(.dw-card .row) {
    margin-left: 0;
    margin-right: 0;
}

/* The little "Mod:+0" badges: make them pop slightly */
:deep(.badge),
:deep(.pill),
:deep(.rpgk-pill) {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #e9eef6 !important;
    border: 1px solid rgba(255, 255, 255, 0.14) !important;
}

/* Roll buttons: increase separation slightly without changing your palette */
:deep(.btn-outline-secondary),
:deep(.btn-outline-light) {
    border-color: rgba(255, 255, 255, 0.18) !important;
    color: rgba(255, 255, 255, 0.78) !important;
}

:deep(.btn-outline-secondary:hover),
:deep(.btn-outline-light:hover) {
    background: rgba(255, 255, 255, 0.06) !important;
}

.sheet-layout {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
}

.portrait-rail {
    width: 300px;
}

.sheet-content {
    min-width: 0;
}

.middle-header-col {
    flex: 1 1 400px;
    min-width: 360px;
}

.middle-header-content {
    padding-left: 0;
}

.portrait-wrap {
    width: 300px;
    min-width: 300px;
    height: 450px;
}

.portrait-thumb,
.portrait-placeholder {
    width: 300px;
    height: 450px;
    border-radius: 8px;
}

.portrait-thumb {
    object-fit: cover;
    display: block;
    border: 1px solid rgba(255, 255, 255, 0.14);
}

.portrait-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    color: #b9c3d1;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.14);
    text-align: center;
    padding: 0.25rem;
}

.portrait-input-row {
    max-width: 460px;
}

.header-rolls-column {
    flex: 0 0 380px;
    width: 380px;
    min-width: 360px;
}

.roll-results-panel {
    width: 380px;
    min-width: 360px;
    max-width: 420px;
    height: 250px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.04);
    display: flex;
    flex-direction: column;
    padding: 0;
}

.roll-results-header {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.roll-results-body {
    padding: 12px 14px;
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
}

.roll-results-list {
    min-height: 0;
}

.dw-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1050;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
}

.dw-modal {
    width: min(560px, 100%);
    max-height: calc(100vh - 2rem);
    display: flex;
    flex-direction: column;
    background: #1f2430;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 8px;
    overflow: hidden;
}

.dw-modal-header,
.dw-modal-footer {
    padding: 0.75rem 1rem;
    border-color: rgba(255, 255, 255, 0.12);
}

.dw-modal-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.dw-modal-body {
    padding: 0.75rem 1rem;
    overflow-y: auto;
}

.dw-modal-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

.roll-result-entry + .roll-result-entry {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.save-targets-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.save-target-item {
    min-width: 130px;
    flex: 1 1 130px;
}

.mr-column {
    min-width: 90px;
}

.mr-input {
    width: 82px;
    min-width: 82px;
}

@media (max-width: 576px) {
    .sheet-layout {
        grid-template-columns: 1fr;
    }

    .header-bar {
        flex-wrap: wrap;
    }

    .portrait-rail,
    .middle-header-col,
    .header-rolls-column {
        width: 100%;
        min-width: 0;
        flex: 1 1 100%;
    }

    .header-rolls-column {
        margin-top: 0.5rem;
    }

    .middle-header-content {
        padding-left: 0;
    }

    .roll-results-panel {
        width: 100%;
        min-width: 0;
        max-width: 100%;
    }

    .portrait-wrap {
        width: 100%;
        min-width: 0;
        height: auto;
        aspect-ratio: 2 / 3;
    }

    .portrait-thumb,
    .portrait-placeholder {
        width: 100%;
        height: 100%;
    }

    .mr-column {
        margin-left: 0 !important;
    }
}
</style>

<script lang="ts" setup>
    import { computed, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useCharacterStore } from '@client/lib/resource-access/stores/characters';
    import { calculateDerivedEncumbrance, sumItemWeights } from '../encumbrance.ts';

    type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
    type SaveKey = 'doom' | 'ray' | 'hold' | 'blast' | 'spell';

    interface AbilityDef {
        key : AbilityKey;
        label : string;
    }

    interface SaveDef {
        key : SaveKey;
        label : string;
    }

    interface InventoryItem
    {
        name : string;
        weight : number;
    }

    const storeInstance = useCharacterStore();
    const { current } = storeToRefs(storeInstance);
    const store = storeInstance as unknown as Record<string, unknown>;

    const abilityList : AbilityDef[] = [
        { key: 'str', label: 'Strength' },
        { key: 'dex', label: 'Dexterity' },
        { key: 'con', label: 'Constitution' },
        { key: 'int', label: 'Intelligence' },
        { key: 'wis', label: 'Wisdom' },
        { key: 'cha', label: 'Charisma' },
    ];

    const saveList : SaveDef[] = [
        { key: 'doom', label: 'Doom' },
        { key: 'ray', label: 'Ray' },
        { key: 'hold', label: 'Hold' },
        { key: 'blast', label: 'Blast' },
        { key: 'spell', label: 'Spell' },
    ];

    function toNumber(value : unknown) : number 
    {
        const num = Number(value);
        if(Number.isFinite(num)) 
        {
            return num;
        }
        return 0;
    }

    function pad2(value : number) : string 
    {
        return String(value).padStart(2, '0');
    }

    function formatTime(date : Date) : string 
    {
        const hh = pad2(date.getHours());
        const mm = pad2(date.getMinutes());
        const ss = pad2(date.getSeconds());
        return `${ hh }:${ mm }:${ ss }`;
    }

    function makeEmptyDetails() : any 
    {
        const abilities : Record<AbilityKey, { score : number }> = {
            str: { score: 10 },
            dex: { score: 10 },
            con: { score: 10 },
            int: { score: 10 },
            wis: { score: 10 },
            cha: { score: 10 },
        };

        const saves : Record<SaveKey | 'magic' | 'resistance', number> = {
            doom: 0,
            ray: 0,
            hold: 0,
            blast: 0,
            spell: 0,
            magic: 0,
            resistance: 0,
        };

        return {
            identity: {
                className: '',
                race: '',
                alignment: '',
                deity: '',
                background: '',
            },

            // NEW: portrait area
            portrait: {
                imageUrl: '', // e.g. https://... or a local blob/data URL if you go that route later
                caption: '', // optional
            },

            abilities,
            saves,

            hpCurrent: 0,
            hpMax: 0,
            ac: 0,
            attack: 0,

            movement: {
                speedRoundFt: 0,
                exploringTurnFt: 0,
                overlandPtsDay: 0,
            },

            skills: {
                listen: 0,
                search: 0,
                survival: 0,
                modifier: 0,
            },

            advancement: {
                xp: 0,
                level: 1,
                nextLevel: 0,
            },

            inventory: {
                gearText: '',
                items: [],
                totalWeight: 0,
                coins: {
                    cp: 0,
                    sp: 0,
                    gp: 0,
                    pell: 0,
                },
            },

            // NEW: equipped items area
            equipped: {
                weapons: [
                // example shape; you can start empty if you prefer
                // { name : '', damage : '1d6', toHit : 0, notes : '', equipped : true }
                ],
                armor: [
                // { name : '', ac : 0, notes : '', equipped : true }
                ],
                shield: {
                    name: '',
                    acBonus: 0,
                    notes: '',
                    equipped: false,
                },
                misc: [
                // { name : '', effect : '', notes : '', equipped : false }
                ],
            },

            notes: '',
            derivedEncumbrance: 0,
        };
    }

    const details = computed<any>({
        get() 
        {
            const character = current.value as any;

            if(!character) 
            {
                return makeEmptyDetails();
            }

            if(!character.details) 
            {
                character.details = {};
            }

            if(!character.details.dolmenwood) 
            {
                character.details.dolmenwood = makeEmptyDetails();
            }

            return character.details.dolmenwood;
        },
        set(value) 
        {
            const character = current.value as any;

            if(!character) 
            {
                return;
            }

            if(!character.details) 
            {
                character.details = {};
            }

            character.details.dolmenwood = value;
        },
    });

    const rollExpr = ref<string>('1d20');
    const lastRoll = ref<string>('');
    const dirty = ref<boolean>(false);
    const saving = ref<boolean>(false);
    const lastSavedAt = ref<string>('');
    const portraitLoadError = ref<boolean>(false);
    const saveBonus = ref<number>(0);
    const showAbilitiesModal = ref<boolean>(false);
    const abilityDraft = ref<Record<AbilityKey, number>>({
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
    });
    const rollLog = ref<{
        timestamp : string;
        rollType : string;
        label : string;
        formula : string;
        die : number;
        bonus : number;
        total : number;
        target : number | null;
        passed : boolean | null;
    }[]>([]);

    const characterName = computed<string>(() =>
    {
        const name = current.value?.name?.trim() ?? '';
        return name || 'Unnamed Character';
    });

    const portraitUrl = computed<string>({
        get() : string
        {
            return current.value?.portrait ?? '';
        },
        set(value : string)
        {
            if(current.value)
            {
                current.value.portrait = value;
            }
        },
    });

    const hpPercent = computed<string>(() => 
    {
        const max = toNumber(details.value.hpMax);
        const cur = toNumber(details.value.hpCurrent);
        if(max <= 0) 
        {
            return '—';
        }
        const pct = Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
        return `${ pct }%`;
    });

    const hpPercentValue = computed<number>(() =>
    {
        if(hpPercent.value === '—')
        {
            return 0;
        }

        const parsed = Number(hpPercent.value.replace('%', ''));
        if(Number.isFinite(parsed))
        {
            return Math.max(0, Math.min(100, parsed));
        }

        return 0;
    });

    const coinTotal = computed<number>(() => 
    {
        const coins = details.value.inventory?.coins ?? {};
        return (
            toNumber(coins.cp)
            + toNumber(coins.sp)
            + toNumber(coins.gp)
            + toNumber(coins.pell)
        );
    });

    const itemWeightTotal = computed<number>(() =>
    {
        const items = Array.isArray(details.value.inventory?.items) ? details.value.inventory.items : [];
        return sumItemWeights(items as InventoryItem[]);
    });

    const derivedEncumbrance = computed<number>(() =>
    {
        const items = Array.isArray(details.value.inventory?.items) ? details.value.inventory.items : [];
        const strengthScore = toNumber(details.value.abilities?.str?.score);
        return calculateDerivedEncumbrance(items as InventoryItem[], strengthScore);
    });

    function abilityModNumber(key : AbilityKey) : number 
    {
        const score = toNumber(details.value.abilities?.[key]?.score);
        return Math.floor((score - 10) / 2);
    }

    function abilityMod(key : AbilityKey) : string 
    {
        const mod = abilityModNumber(key);
        if(mod >= 0) 
        {
            return `+${ mod }`;
        }
        return `${ mod }`;
    }

    function formatSigned(value : number) : string
    {
        if(value >= 0)
        {
            return `+${ value }`;
        }
        return `${ value }`;
    }

    function addRollLogEntry(entry : {
        rollType : string;
        label : string;
        formula : string;
        die : number;
        bonus : number;
        total : number;
        target ?: number;
        passed ?: boolean;
    }) : void
    {
        rollLog.value.unshift({
            timestamp: formatTime(new Date()),
            rollType: entry.rollType,
            label: entry.label,
            formula: entry.formula,
            die: entry.die,
            bonus: entry.bonus,
            total: entry.total,
            target: entry.target ?? null,
            passed: entry.passed ?? null,
        });

        if(rollLog.value.length > 15)
        {
            rollLog.value = rollLog.value.slice(0, 15);
        }
    }

    function clearRollLog() : void
    {
        rollLog.value = [];
    }

    async function saveNow() : Promise<void> 
    {
        saving.value = true;

        try 
        {
            details.value.inventory.totalWeight = itemWeightTotal.value;
            details.value.derivedEncumbrance = derivedEncumbrance.value;

            const anyStore = store as any;

            if(typeof anyStore.saveCurrent === 'function') 
            {
                await anyStore.saveCurrent();
            }
            else if(typeof anyStore.save === 'function') 
            {
                await anyStore.save();
            }
            else if(typeof anyStore.updateCurrent === 'function') 
            {
                await anyStore.updateCurrent();
            }

            dirty.value = false;
            lastSavedAt.value = formatTime(new Date());
        }
        finally 
        {
            saving.value = false;
        }
    }

    function addInventoryItem() : void
    {
        if(!Array.isArray(details.value.inventory.items))
        {
            details.value.inventory.items = [];
        }

        details.value.inventory.items.push({
            name: '',
            weight: 0,
        });
    }

    function removeInventoryItem(index : number) : void
    {
        if(!Array.isArray(details.value.inventory.items))
        {
            return;
        }

        details.value.inventory.items.splice(index, 1);
    }

    function clearPortrait() : void
    {
        portraitUrl.value = '';
    }

    function openAbilitiesModal() : void
    {
        abilityDraft.value = {
            str: toNumber(details.value.abilities?.str?.score),
            dex: toNumber(details.value.abilities?.dex?.score),
            con: toNumber(details.value.abilities?.con?.score),
            int: toNumber(details.value.abilities?.int?.score),
            wis: toNumber(details.value.abilities?.wis?.score),
            cha: toNumber(details.value.abilities?.cha?.score),
        };
        showAbilitiesModal.value = true;
    }

    function saveAbilitiesModal() : void
    {
        if(!details.value.abilities)
        {
            details.value.abilities = {};
        }

        for(const ability of abilityList)
        {
            const score = toNumber(abilityDraft.value[ability.key]);
            details.value.abilities[ability.key] = { score };
        }

        showAbilitiesModal.value = false;
    }

    function cancelAbilitiesModal() : void
    {
        showAbilitiesModal.value = false;
    }

    let autosaveTimer : number | null = null;
    let initialized = false;

    function scheduleAutosave() : void 
    {
        if(autosaveTimer !== null) 
        {
            window.clearTimeout(autosaveTimer);
            autosaveTimer = null;
        }

        autosaveTimer = window.setTimeout(async () => 
        {
            autosaveTimer = null;

            if(!dirty.value) 
            {
                return;
            }

            if(saving.value) 
            {
                return;
            }

            await saveNow();
        }, 800);
    }

    watch(details, () => 
    {
        if(!initialized) 
        {
            initialized = true;
            return;
        }

        dirty.value = true;
        scheduleAutosave();
    }, { deep: true });

    let portraitInitialized = false;

    watch(portraitUrl, () =>
    {
        portraitLoadError.value = false;

        if(!portraitInitialized)
        {
            portraitInitialized = true;
            return;
        }

        dirty.value = true;
        scheduleAutosave();
    });

    function rollD20(modifier : number, label : string) : void 
    {
        const rollValue = Math.floor(Math.random() * 20) + 1;
        const total = rollValue + toNumber(modifier);
        addRollLogEntry({
            rollType: 'Check',
            label,
            formula: `1d20 ${ formatSigned(modifier) }`,
            die: rollValue,
            bonus: modifier,
            total,
        });
    }

    function rollSaveTarget(saveKey : SaveKey) : void
    {
        const rollValue = Math.floor(Math.random() * 20) + 1;
        const bonus = toNumber(saveBonus.value);
        const target = toNumber(details.value.saves?.[saveKey]);
        const total = rollValue + bonus;
        const passed = total > target;
        const label = saveList.find((save) => save.key === saveKey)?.label ?? 'Save';

        addRollLogEntry({
            rollType: 'Save',
            label: `${ label } Save`,
            formula: `1d20 ${ formatSigned(bonus) }`,
            die: rollValue,
            bonus,
            total,
            target,
            passed,
        });
    }

    function roll(expr : string) : void 
    {
        const trimmed = (expr ?? '').trim();
        const match = trimmed.match(/^(\d+)d(\d+)(?:\s*\+\s*(\d+))?$/i);

        if(!match) 
        {
            addRollLogEntry({
                rollType: 'Roll',
                label: 'Manual Roll',
                formula: trimmed,
                die: 0,
                bonus: 0,
                total: 0,
            });
            return;
        }

        const count = parseInt(match[1], 10);
        const dieSides = parseInt(match[2], 10);
        const add = match[3] ? parseInt(match[3], 10) : 0;

        let total = add;
        const rolls : number[] = [];

        for(let idx = 0; idx < count; idx++) 
        {
            const rollValue = Math.floor(Math.random() * dieSides) + 1;
            rolls.push(rollValue);
            total += rollValue;
        }
        const die = rolls.length === 1 ? rolls[0] : rolls.reduce((sum, value) => sum + value, 0);
        addRollLogEntry({
            rollType: 'Roll',
            label: 'Manual Roll',
            formula: trimmed,
            die,
            bonus: add,
            total,
        });
    }
</script>
