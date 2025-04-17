// 验证工具函数
const validateRequired = (value) => {
  return value !== undefined && value !== null && value !== ''
}

const validateLength = (value, min, max) => {
  if (value === undefined || value === null) return false
  const length = value.toString().length
  return length >= min && length <= max
}

const validateNumberRange = (value, min, max) => {
  if (value === undefined || value === null) return false
  return value >= min && value <= max
}

const validateEmail = (value) => {
  if (!value) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

const validatePhone = (value) => {
  if (!value) return false
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(value)
}

// 问题类型验证函数
export const validateQuestion = (question) => {
  const errors = []

  // 验证问题描述
  if (!validateRequired(question.description)) {
    errors.push('问题描述不能为空')
  }

  // 根据问题类型进行验证
  switch (question.type) {
    case 'single_choice':
    case 'multiple_choice':
      if (!question.options || question.options.length === 0) {
        errors.push('至少需要一个选项')
      } else {
        question.options.forEach((option, index) => {
          if (!validateRequired(option.description)) {
            errors.push(`选项 ${index + 1} 不能为空`)
          }
        })
      }
      if (question.type === 'multiple_choice') {
        if (question.minSelect > question.maxSelect) {
          errors.push('最少选择数不能大于最多选择数')
        }
        if (question.maxSelect > question.options.length) {
          errors.push('最多选择数不能大于选项总数')
        }
        if (question.required && question.minSelect < 1) {
          errors.push('必填题的最少选择数必须大于0')
        }
      }
      break

    case 'text':
      if (question.inputType === 'textarea' && question.maxLength < 1) {
        errors.push('最大字数必须大于0')
      }
      if (question.inputType === 'number') {
        if (question.minValue >= question.maxValue) {
          errors.push('最小值必须小于最大值')
        }
      }
      break

    case 'matrix':
      if (!question.rows || question.rows.length === 0) {
        errors.push('至少需要一行')
      } else {
        question.rows.forEach((row, index) => {
          if (!validateRequired(row.title)) {
            errors.push(`行标题 ${index + 1} 不能为空`)
          }
        })
      }
      if (!question.columns || question.columns.length === 0) {
        errors.push('至少需要一列')
      } else {
        question.columns.forEach((column, index) => {
          if (!validateRequired(column.title)) {
            errors.push(`列标题 ${index + 1} 不能为空`)
          }
        })
      }
      break

    case 'sort':
      if (!question.options || question.options.length === 0) {
        errors.push('至少需要一个选项')
      } else {
        question.options.forEach((option, index) => {
          if (!validateRequired(option.description)) {
            errors.push(`选项 ${index + 1} 不能为空`)
          }
        })
      }
      break

    case 'rating':
      if (question.minScore >= question.maxScore) {
        errors.push('最小分数必须小于最大分数')
      }
      if (question.maxScore - question.minScore < 1) {
        errors.push('评分范围至少为1分')
      }
      break

    case 'file_upload':
      if (!question.fileTypes || question.fileTypes.length === 0) {
        errors.push('至少需要选择一种文件类型')
      }
      if (question.maxSize < 1) {
        errors.push('文件大小限制必须大于0')
      }
      if (question.maxFiles < 1) {
        errors.push('最大文件数必须大于0')
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 验证答案函数
export const validateAnswer = (question, answer) => {
  const errors = []

  // 验证必填
  if (question.required && !validateRequired(answer)) {
    errors.push('此问题为必填项')
    return { isValid: false, errors }
  }

  // 根据问题类型验证答案
  switch (question.type) {
    case 'single_choice':
      if (answer && !question.options.some(opt => opt.id === answer)) {
        errors.push('请选择有效选项')
      }
      break

    case 'multiple_choice':
      if (Array.isArray(answer)) {
        if (answer.length < question.minSelect) {
          errors.push(`至少需要选择 ${question.minSelect} 个选项`)
        }
        if (answer.length > question.maxSelect) {
          errors.push(`最多只能选择 ${question.maxSelect} 个选项`)
        }
        answer.forEach(selected => {
          if (!question.options.some(opt => opt.id === selected)) {
            errors.push('包含无效选项')
          }
        })
      }
      break

    case 'text':
      if (answer) {
        if (question.inputType === 'textarea' && !validateLength(answer, 1, question.maxLength)) {
          errors.push(`文本长度必须在1-${question.maxLength}之间`)
        }
        if (question.inputType === 'number' && !validateNumberRange(answer, question.minValue, question.maxValue)) {
          errors.push(`数字必须在${question.minValue}-${question.maxValue}之间`)
        }
        if (question.inputType === 'email' && !validateEmail(answer)) {
          errors.push('请输入有效的邮箱地址')
        }
        if (question.inputType === 'phone' && !validatePhone(answer)) {
          errors.push('请输入有效的手机号码')
        }
      }
      break

    case 'matrix':
      if (answer) {
        const rowIds = question.rows.map(row => row.id)
        const columnIds = question.columns.map(column => column.id)
        Object.entries(answer).forEach(([rowId, columnId]) => {
          if (!rowIds.includes(rowId) || !columnIds.includes(columnId)) {
            errors.push('包含无效的行或列')
          }
        })
      }
      break

    case 'sort':
      if (Array.isArray(answer)) {
        const optionIds = question.options.map(opt => opt.id)
        if (answer.length !== optionIds.length) {
          errors.push('排序结果不完整')
        }
        answer.forEach(id => {
          if (!optionIds.includes(id)) {
            errors.push('包含无效选项')
          }
        })
      }
      break

    case 'rating':
      if (answer && !validateNumberRange(answer, question.minScore, question.maxScore)) {
        errors.push(`评分必须在${question.minScore}-${question.maxScore}之间`)
      }
      break

    case 'file_upload':
      if (Array.isArray(answer)) {
        if (answer.length > question.maxFiles) {
          errors.push(`最多只能上传 ${question.maxFiles} 个文件`)
        }
        // 这里可以添加文件类型和大小的验证
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors
  }
} 