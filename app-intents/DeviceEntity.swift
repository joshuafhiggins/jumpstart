import AppIntents
internal import ExpoAppIntents
import Foundation

private func normalizeDeviceText(_ value: String) -> String {
  value
    .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
    .trimmingCharacters(in: .whitespacesAndNewlines)
}

struct DeviceEntity: AppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Device"
  static let defaultQuery = DeviceQuery()

  var id: String
  @Property(title: "Name")
  var name: String
  var subtitle: String?
  var synonyms: [String]

  var displayRepresentation: DisplayRepresentation {
    if let subtitle {
      if #available(iOS 17.0, *) {
        return DisplayRepresentation(
          title: "\(name)",
          subtitle: "\(subtitle)",
          synonyms: synonyms.map { LocalizedStringResource(stringLiteral: $0) }
        )
      }
      return DisplayRepresentation(title: "\(name)", subtitle: "\(subtitle)")
    }

    if #available(iOS 17.0, *) {
      return DisplayRepresentation(
        title: "\(name)",
        synonyms: synonyms.map { LocalizedStringResource(stringLiteral: $0) }
      )
    }
    return DisplayRepresentation(title: "\(name)")
  }

  init(record: AppIntentEntityRecord) {
    self.id = record.id
    self.subtitle = record.subtitle
    self.synonyms = record.synonyms
    self.name = record.title
  }

  func matches(_ searchText: String) -> Bool {
    let normalizedSearch = normalizeDeviceText(searchText)
    guard !normalizedSearch.isEmpty else {
      return false
    }

    return ([name, id] + synonyms).map(normalizeDeviceText).contains { term in
      normalizedSearch == term || normalizedSearch.contains(term) || term.contains(normalizedSearch)
    }
  }
}
