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
    const errors = {}

    // 验证问题描述
    if (!validateRequired(question.description)) {
        errors.description = '问题描述不能为空'
    }

    // 根据问题类型进行验证
    switch (question.type) {
        case '单选':
        case '多选':
            if (!question.options || question.options.length === 0) {
                errors.options = '至少需要添加一个选项'
            } else {
                const emptyOptions = question.options.filter(option => !validateRequired(option.description))
                if (emptyOptions.length > 0) {
                    errors.options = '选项描述不能为空'
                }
            }
            if (question.type === '多选') {
                if (question.minSelections > question.maxSelections) {
                    errors.selections = '最少选择数不能大于最多选择数'
                }
                if (question.maxSelections > question.options?.length) {
                    errors.selections = '最多选择数不能大于选项总数'
                }
            }
            break

        case '填空':
            // 填空题不需要特殊验证
            break

        case '矩阵单选':
        case '矩阵多选':
            const rowOptions = question.options?.filter(opt => opt.type === '行选项') || []
            const colOptions = question.options?.filter(opt => opt.type === '列选项') || []
            
            if (rowOptions.length === 0) {
                errors.rows = '至少需要添加一个行选项'
            }
            if (colOptions.length === 0) {
                errors.columns = '至少需要添加一个列选项'
            }
            
            const emptyRows = rowOptions.filter(row => !validateRequired(row.description))
            const emptyCols = colOptions.filter(col => !validateRequired(col.description))
            
            if (emptyRows.length > 0) {
                errors.rows = '行选项描述不能为空'
            }
            if (emptyCols.length > 0) {
                errors.columns = '列选项描述不能为空'
            }
            break

        case '评分题':
            if (!question.options || question.options.length === 0) {
                errors.options = '至少需要添加一个评分项'
            } else {
                const emptyOptions = question.options.filter(option => !validateRequired(option.description))
                if (emptyOptions.length > 0) {
                    errors.options = '评分项描述不能为空'
                }
            }
            break

        case '排序':
            if (!question.options || question.options.length === 0) {
                errors.options = '至少需要添加一个选项'
            } else {
                const emptyOptions = question.options.filter(option => !validateRequired(option.description))
                if (emptyOptions.length > 0) {
                    errors.options = '选项描述不能为空'
                }
            }
            break

        case '文件上传题':
            // 文件上传题不需要特殊验证
            break
    }

    return errors
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