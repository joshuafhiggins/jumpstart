import AppIntents
internal import ExpoAppIntents

/// Resolves devices from the catalog published by `syncDevicesToWidget`.
struct DeviceQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [DeviceEntity] {
    try await AppIntentEntityStore.shared
      .entities(ofKind: "device", matching: identifiers)
      .map(DeviceEntity.init(record:))
  }

  func suggestedEntities() async throws -> [DeviceEntity] {
    try await AppIntentEntityStore.shared
      .entities(ofKind: "device")
      .map(DeviceEntity.init(record:))
  }

  func entities(matching string: String) async throws -> [DeviceEntity] {
    let search = string.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !search.isEmpty else {
      return []
    }
    return try await suggestedEntities().filter { $0.matches(search) }
  }
}
