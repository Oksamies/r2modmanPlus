<template>
    <div class="package-order">
        <label>Sort by:</label>
        <div class="select-wrapper">
            <select :value="order" @change="onChange">
                <option :value="Order.Updated">Last Updated</option>
                <option :value="Order.Created">Newest</option>
                <option :value="Order.Downloaded">Most Downloaded</option>
                <option :value="Order.Rated">Top Rated</option>
            </select>
            <i class="fas fa-chevron-down"></i>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue';
import { PackageListingsOrderingEnum } from '../../../../r2mm/api/schemas/queryParamSchemas';

const Order = PackageListingsOrderingEnum;

const props = defineProps({
    order: {
        type: String as PropType<PackageListingsOrderingEnum>,
        default: PackageListingsOrderingEnum.Updated
    },
    setOrder: {
        type: Function as PropType<(v: PackageListingsOrderingEnum) => void>,
        required: true
    }
});

const onChange = (e: Event) => {
    props.setOrder((e.target as HTMLSelectElement).value as PackageListingsOrderingEnum);
};
</script>

<style lang="scss" scoped>
.package-order {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #a7aed2;
}

.select-wrapper {
    position: relative;
    
    select {
        appearance: none;
        background-color: #111121;
        border: 1px solid #29295b;
        color: #f5f5f6;
        padding: 6px 32px 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-family: inherit;
        outline: none;
        
        &:focus {
            border-color: #23ffab;
        }
    }
    
    i {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: #a7aed2;
        font-size: 12px;
    }
}
</style>
