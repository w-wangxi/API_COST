export function calculateTextModelCost(
  model,
  inputTokens,
  outputTokens,
  monthlyRequests,
  useCachedInput = false,
) {
  const inputPrice =
    useCachedInput && model.cachedInputPrice !== null
      ? model.cachedInputPrice
      : model.inputPrice
  const inputCost = (inputTokens * monthlyRequests * inputPrice) / 1000000
  const outputCost = (outputTokens * monthlyRequests * model.outputPrice) / 1000000
  const totalCost = inputCost + outputCost

  return {
    provider: model.provider,
    model: model.model,
    inputCost,
    outputCost,
    totalCost,
    inputPrice,
    outputPrice: model.outputPrice,
    unit: 'USD',
  }
}

export function calculateAllTextModels(
  models,
  inputTokens,
  outputTokens,
  monthlyRequests,
  useCachedInput = false,
) {
  return models
    .map((model) =>
      calculateTextModelCost(
        model,
        inputTokens,
        outputTokens,
        monthlyRequests,
        useCachedInput,
      ),
    )
    .sort((a, b) => a.totalCost - b.totalCost)
}

export function calculateImageModelCost(model, imageCount, megapixelPerImage = 1) {
  const totalCost =
    model.billingType === 'per_megapixel'
      ? imageCount * megapixelPerImage * model.price
      : imageCount * model.price

  return {
    provider: model.provider,
    model: model.model,
    billingType: model.billingType,
    price: model.price,
    totalCost,
    averageImageCost: imageCount > 0 ? totalCost / imageCount : 0,
    unit: 'USD',
  }
}

export function calculateAllImageModels(models, imageCount, megapixelPerImage = 1) {
  return models
    .map((model) => calculateImageModelCost(model, imageCount, megapixelPerImage))
    .sort((a, b) => a.totalCost - b.totalCost)
}

export function isPositiveNumber(value) {
  const number = Number(value)

  return Number.isFinite(number) && number > 0
}

export function normalizePositiveNumber(value, fallback = 0) {
  return isPositiveNumber(value) ? Number(value) : fallback
}

export function formatUSD(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '$0.00'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount > 0 && amount < 0.01 ? 4 : 2,
    maximumFractionDigits: amount > 0 && amount < 0.01 ? 4 : 2,
  }).format(amount)
}
