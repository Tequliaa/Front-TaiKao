<template>
    <div class="drag-verify-container">
        <div :style="dragVerifyImgStyle">
            <img 
                ref="checkImg" 
                crossOrigin="anonymous" 
                :src="`data:image/png;base64,${imgsrc}`" 
                @load="checkimgLoaded" 
                style="width: 100%" 
                alt="验证图片" 
            />
            <img 
                crossOrigin="anonymous" 
                ref="movecanvas" 
                :class="{ goFirst: isOk, goKeep: isKeep }" 
                :style="{ top: curYzbs + 'px', left: moveCanvasLeft + 'px' }" 
                class="move-canvas" 
                :src="markImages" 
                alt="拖拽滑块"
            />
            <div class="refresh">
                <i :class="refreshIcon" @click="refreshimg" style="color: #fff"></i>
                <i class="el-icon-circle-close" @click="emit('close')" style="color: #fff"></i>
            </div>

            <div class="tips danger" v-show="showErrorTip">{{ failTip }}</div>
        </div>
        <div 
            ref="dragVerify" 
            class="drag_verify" 
            :style="dragVerifyStyle" 
            @mousemove="dragMoving" 
            @mouseup="dragFinish" 
            @mouseleave="dragFinish" 
            @touchmove="dragMoving" 
            @touchend="dragFinish"
        >
            <div 
                class="dv_progress_bar" 
                :class="{ goFirst2: isOk }" 
                ref="progressBar" 
                :style="progressBarStyle"
            >
            </div>
            <div 
                class="dv_text" 
                :style="textStyle" 
                ref="message"
            >
                {{ message }}
            </div>

            <div 
                class="dv_handler dv_handler_bg" 
                :class="{ goFirst: isOk }" 
                @mousedown="dragStart" 
                @touchstart="dragStart" 
                ref="handler" 
                :style="handlerStyle"
            >
                <i :class="handlerIcon"></i>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

// 定义组件属性
const props = defineProps({
    showErrorTip: {
        type: Boolean,
        default: false
    },
    isPassing: {
        type: Boolean,
        default: false
    },
    width: {
        type: Number,
        default: 310
    },
    height: {
        type: Number,
        default: 155
    },
    text: {
        type: String,
        default: "swiping to the right side"
    },
    successText: {
        type: String,
        default: "success"
    },
    background: {
        type: String,
        default: "#eee"
    },
    progressBarBg: {
        type: String,
        default: "#76c61d"
    },
    completedBg: {
        type: String,
        default: "#76c61d"
    },
    circle: {
        type: Boolean,
        default: false
    },
    radius: {
        type: String,
        default: "4px"
    },
    handlerIcon: {
        type: String,
        default: "el-icon-d-arrow-right"
    },
    successIcon: {
        type: String,
        default: "el-icon-success"
    },
    handlerBg: {
        type: String,
        default: "#fff"
    },
    textSize: {
        type: String,
        default: "14px"
    },
    textColor: {
        type: String,
        default: "#333"
    },
    imgsrc: {
        type: String
    },
    barWidth: {
        type: Number,
        default: 40
    },
    barRadius: {
        type: Number,
        default: 8
    },
    showRefresh: {
        type: Boolean,
        default: false
    },
    refreshIcon: {
        type: String,
        default: "el-icon-refresh-right"
    },
    showTips: {
        type: Boolean,
        default: true
    },
    successTip: {
        type: String,
        default: "验证通过"
    },
    failTip: {
        type: String,
        default: "拖动滑块将悬浮图像正确合并"
    },
    diffWidth: {
        type: Number,
        default: 20
    },
    markImages: {
        type: String,
        default: ""
    },
    curYzbs: {
        type: Number,
        default: 0
    }
});

// 定义事件
const emit = defineEmits([
    'close', 
    'handlerMove', 
    'passcallback', 
    'refresh',
    'update:isPassing'
]);

// 组件内部状态
const isMoving = ref(false);
const x = ref(0);
const isOk = ref(false);
const isKeep = ref(false);
const clipBarx = ref(0);
const showErrorTip = ref(false);
const curLeft = ref(null);
const moveCanvasLeft = ref(0);

// 引用
const checkImg = ref(null);
const movecanvas = ref(null);
const dragVerify = ref(null);
const progressBar = ref(null);
const message = ref(null);
const handler = ref(null);

// 计算属性
const handlerStyle = computed(() => ({
    width: '50px',
    height: '50px',
    background: props.handlerBg
}));

const messageText = computed(() => {
    return props.isPassing ? "" : props.text;
});

const successMessage = computed(() => {
    return props.isPassing ? props.successText : "";
});

const dragVerifyStyle = computed(() => ({
    width: `${props.width}px`,
    height: '40px',
    lineHeight: '40px',
    background: props.background,
    borderRadius: props.circle ? '20px' : props.radius
}));

const dragVerifyImgStyle = computed(() => ({
    width: `${props.width}px`,
    position: 'relative',
    overflow: 'hidden'
}));

const progressBarStyle = computed(() => ({
    background: props.progressBarBg,
    height: '40px',
    borderRadius: props.circle ? '20px 0 0 20px' : props.radius,
    width: moveCanvasLeft.value ? `${moveCanvasLeft.value + 20}px` : '0px'
}));

const textStyle = computed(() => ({
    height: '40px',
    width: `${props.width}px`,
    fontSize: props.textSize
}));

// 方法
const draw = (ctx, x, y, operation) => {
    const l = props.barWidth;
    const r = props.barRadius;
    const PI = Math.PI;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x + l / 2, y - r + 2, r, 0.72 * PI, 2.26 * PI);
    ctx.lineTo(x + l, y);
    ctx.arc(x + l + r - 2, y + l / 2, r, 1.21 * PI, 2.78 * PI);
    ctx.lineTo(x + l, y + l);
    ctx.lineTo(x, y + l);
    ctx.arc(x + r - 2, y + l / 2, r + 0.4, 2.76 * PI, 1.24 * PI, true);
    ctx.lineTo(x, y);
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.stroke();
    ctx[operation]();
    ctx.globalCompositeOperation = "destination-over";
};

const checkimgLoaded = () => {
    // 生成图片缺失位置的逻辑
};

const dragStart = (e) => {
    if (!props.isPassing) {
        isMoving.value = true;
        x.value = e.pageX || (e.touches && e.touches[0].pageX);
    }
    showErrorTip.value = true;
    emit('handlerMove');
};

const dragMoving = (e) => {
    if (isMoving.value && !props.isPassing) {
        const clientX = e.pageX || (e.touches && e.touches[0].pageX);
        const _x = clientX - x.value;
        
        // 限制拖拽范围
        if (_x >= 0 && _x <= props.width - 50) {
            moveCanvasLeft.value = _x;
        }
    }
};

const dragFinish = (e) => {
    if (isMoving.value && !props.isPassing) {
        const clientX = e.pageX || (e.changedTouches && e.changedTouches[0].pageX);
        const _x = clientX - x.value;
        passVerify(_x);
        isMoving.value = false;
    }
};

const passVerify = (curLeftVal) => {
    if (curLeftVal === 0) return;
    
    emit('update:isPassing', true);
    isMoving.value = false;
    
    if (handler.value && handler.value.children[0]) {
        handler.value.children[0].className = props.successIcon;
    }
    
    if (progressBar.value) {
        progressBar.value.style.background = props.completedBg;
    }
    
    if (message.value) {
        message.value.style["-webkit-text-fill-color"] = "unset";
        message.value.style.animation = "slidetounlock2 3s infinite";
    }
    
    if (progressBar.value) {
        progressBar.value.style.color = "#fff";
        progressBar.value.style.fontSize = props.textSize;
    }
    
    isKeep.value = true;
    
    setTimeout(() => {
        moveCanvasLeft.value = curLeftVal;
        setTimeout(() => {
            isKeep.value = false;
        }, 200);
    }, 100);
    
    emit('passcallback', curLeftVal);
};

const reset = () => {
    reImg();
};

const reImg = () => {
    emit('update:isPassing', false);
    isMoving.value = false;
    isOk.value = false;
    isKeep.value = false;
    clipBarx.value = 0;
    showErrorTip.value = false;
    moveCanvasLeft.value = 0;
    
    if (handler.value) {
        handler.value.style.left = "0";
        if (handler.value.children[0]) {
            handler.value.children[0].className = props.handlerIcon;
        }
    }
    
    if (progressBar.value) {
        progressBar.value.style.width = "0";
    }
    
    if (message.value) {
        message.value.style["-webkit-text-fill-color"] = "transparent";
        message.value.style.animation = "slidetounlock 3s infinite";
        message.value.style.color = props.background;
    }
    
    if (movecanvas.value) {
        movecanvas.value.style.left = "0px";
    }
};

const refreshimg = () => {
    emit('refresh');
};

// 生命周期钩子
onMounted(() => {
    if (dragVerify.value) {
        dragVerify.value.style.setProperty("--textColor", props.textColor);
        dragVerify.value.style.setProperty("--width", `${Math.floor(props.width / 2)}px`);
        dragVerify.value.style.setProperty("--pwidth", `-${Math.floor(props.width / 2)}px`);
    }
});

// 监听
watch(
    () => props.imgsrc,
    () => {
        reImg();
    }
);
</script>
