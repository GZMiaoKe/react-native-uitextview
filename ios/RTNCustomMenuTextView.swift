let CUSTOM_SELECTOR: String = "_CUSTOM_SELECTOR_"

class RTNCustomMenuTextView: UITextView {
    var menuItems: [[String: String]] = [] {
        didSet {
            updateMenuItems()
        }
    }
    var onSelection: RCTDirectEventBlock?
    
    private func updateMenuItems() {
        let menuController = UIMenuController.shared
        guard menuItems.count > 0 else {
            return
        }
        menuController.menuItems = menuItems.map { menuItem in
            guard let title = menuItem["title"],
                  let key = menuItem["key"] else {
                return UIMenuItem()
            }
            let sel = NSString(format: "%@%@", CUSTOM_SELECTOR, key) as String
            let selector = NSSelectorFromString(sel)
            let menuItem = UIMenuItem(title: title, action: selector)
            return menuItem
        }
        menuController.update()
    }
    
    override func canPerformAction(_ action: Selector, withSender sender: Any?) -> Bool {
        return action.matchCustomSelector() != nil
    }
    
    override static func resolveInstanceMethod(_ sel: Selector) -> Bool {
        if sel.matchCustomSelector() != nil {
            let receiver = #selector(handleMenuItem(_:))
            let imp = class_getMethodImplementation(self, receiver)!
            let method = class_getInstanceMethod(self, receiver)!
            let methodType = method_getTypeEncoding(method)
            class_addMethod(self, sel, imp, methodType)
            return true
        }
        return false
    }
    
    @objc func handleMenuItem(_ sender: Any?) {
        if #available(iOS 13.0, *) {
            if let cmd = sender as? UICommand,
               let menuItem = cmd.action.matchCustomSelector(),
               let onSelection = self.onSelection {
                var body: [String: Any] = [
                    "eventType": menuItem,
                ]
                if let selected = self.selectedTextRange {
                    let selectedText = self.text(in: selected)
                    let start = self.offset(from: self.beginningOfDocument, to: selected.start)
                    let end = self.offset(from: self.beginningOfDocument, to: selected.end)
                    body["content"] = selectedText
                    body["start"] = start
                    body["end"] = end
                }
                onSelection(body)
                self.selectedTextRange = nil
            }
        }
    }
}

extension Selector {
    func matchCustomSelector() -> String? {
        let selStr = NSStringFromSelector(self)
        let match = selStr.range(of: CUSTOM_SELECTOR)
        if match != nil {
            return selStr.replacingOccurrences(of: CUSTOM_SELECTOR, with: "")
        }
        return nil
    }
}
