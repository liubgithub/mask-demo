// 数学工具函数
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

// 向量运算
function vectorAdd(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

function vectorScale(v, scale) {
    return [v[0] * scale, v[1] * scale, v[2] * scale];
}

function vectorLength(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function vectorNormalize(v) {
    const len = vectorLength(v);
    return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
}

// 矩阵旋转
function rotateAroundX(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
        point[0],
        point[1] * cos - point[2] * sin,
        point[1] * sin + point[2] * cos
    ];
}

function rotateAroundZ(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
        point[0] * cos - point[1] * sin,
        point[0] * sin + point[1] * cos,
        point[2]
    ];
}

function dist(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2) + Math.pow(point1.z - point2.z, 2));
}
const frustum = {
    calculatePyramidBase: function (apex, pitch, heading, height, horizonAngle, verticalAngle) {
        const pitchRad = toRadians(pitch);
        const headingRad = toRadians(heading);
        const horizonRad = toRadians(horizonAngle / 2);  // 半角
        const verticalRad = toRadians(verticalAngle / 2); // 半角
        
        // 根据张角和高度计算底面的实际尺寸
        const halfWidth = height * Math.tan(horizonRad);   // 底面半宽
        const halfHeight = height * Math.tan(verticalRad); // 底面半高
        
        // 定义基础底面形状（在XY平面，以原点为中心）
        const basePoints = [
            [-halfWidth, -halfHeight, 0],  // 左下
            [halfWidth, -halfHeight, 0],   // 右下
            [halfWidth, halfHeight, 0],    // 右上
            [-halfWidth, halfHeight, 0]    // 左上
        ];
        
        // 计算四棱锥的朝向向量（从顶点指向底面中心）
        // 基础朝向是Z轴负方向 [0, 0, -1]
        let direction = [0, 0, -1];
        
        // 应用俯仰角旋转（绕X轴）
        direction = rotateAroundX(direction, pitchRad);
        
        // 应用方位角旋转（绕Z轴）
        direction = rotateAroundZ(direction, headingRad);
        
        // 归一化方向向量
        direction = vectorNormalize(direction);
        
        // 计算底面中心点
        const baseCenter = vectorAdd(apex, vectorScale(direction, height));
        
        // 对每个底面点应用旋转变换
        const transformedPoints = basePoints.map(point => {
            // 先应用俯仰角旋转
            let rotated = rotateAroundX(point, pitchRad);
            // 再应用方位角旋转
            rotated = rotateAroundZ(rotated, headingRad);
            // 平移到底面中心
            return vectorAdd(baseCenter, rotated);
        });
        
        return {
            apex: apex,
            baseCenter: baseCenter,
            basePoints: transformedPoints,
            direction: direction,
            actualWidth: halfWidth * 2,
            actualHeight: halfHeight * 2,
            halfWidth: halfWidth,
            halfHeight: halfHeight
        };
    },
    isInLine(from, to, intersection) {
        const disFromTo = dist(from, to);
        const disFromIntersect = dist(from, intersection);
        const disToIntersect = dist(to, intersection);
        const delta = (disFromIntersect + disToIntersect) - disFromTo;
        if ( delta > 0.001) {
            return false;
        }
        return true;
    },
    calculateLineProjectIntersection: function(pointA, pointB, planeHeight) {
        const [x1, y1, z1] = pointA;
        const [x2, y2, z2] = pointB;
        const H = planeHeight;
        
        // 检查线段是否平行于水平面
        if (Math.abs(z2 - z1) < 1e-10) {
            if (Math.abs(z1 - H) < 1e-10) {
                return {
                    hasIntersection: true,
                    type: 'coincident',
                    message: '线段完全位于水平面上',
                    t: null,
                    intersection: null
                };
            } else {
                return {
                    hasIntersection: false,
                    type: 'parallel',
                    message: '线段平行于水平面，无交点',
                    t: null,
                    intersection: null
                };
            }
        }
        
        // 计算参数t
        const t = (H - z1) / (z2 - z1);
        
        // 计算交点坐标
        const intersectionX = x1 + t * (x2 - x1);
        const intersectionY = y1 + t * (y2 - y1);
        const intersectionZ = H;
        
        if (t >= 0 && t <= 1) {
            return {
                hasIntersection: true,
                type: 'intersect',
                message: '线段与水平面相交',
                t: t,
                intersection: [intersectionX, intersectionY, intersectionZ],
                distanceFromA: t * Math.sqrt((x2-x1)**2 + (y2-y1)**2 + (z2-z1)**2)
            };
        } else if (t < 0) {
            return {
                hasIntersection: false,
                type: 'extension_before',
                message: '延长线在A点之前与平面相交，但线段本身不相交',
                t: t,
                intersection: [intersectionX, intersectionY, intersectionZ]
            };
        } else {
            return {
                hasIntersection: false,
                type: 'extension_after',
                message: '延长线在B点之后与平面相交，但线段本身不相交',
                t: t,
                intersection: [intersectionX, intersectionY, intersectionZ]
            };
        }
    }
}
export default frustum;