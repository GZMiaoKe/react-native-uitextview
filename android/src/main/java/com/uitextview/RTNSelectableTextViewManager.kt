package com.uitextview

import android.view.ActionMode
import android.view.Menu
import android.view.MenuItem
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.views.text.ReactTextView
import com.facebook.react.views.text.ReactTextViewManager

class RTNSelectableTextViewManager : ReactTextViewManager() {
  override fun getName() = "RTNSelectableTextView"

  override fun createViewInstance(reactContext: ThemedReactContext): ReactTextView {
    return ReactTextView(reactContext)
  }

  @ReactProp(name = "menuItems")
  fun setMenuItems(textView: ReactTextView, items: ReadableArray) {
    val result: MutableList<String> = ArrayList<String>(items.size())
    for (i in 0 until items.size()) {
      result.add(items.getString(i))
    }

    registerSelectionListener(result.toTypedArray(), textView)
  }

  private fun registerSelectionListener(menuItems: Array<String>, view: ReactTextView) {
    view.customSelectionActionModeCallback = object : ActionMode.Callback {
      override fun onPrepareActionMode(mode: ActionMode?, menu: Menu): Boolean {
        // Called when action mode is first created. The menu supplied
        // will be used to generate action buttons for the action mode
        // Android Smart Linkify feature pushes extra options into the menu
        // and would override the generated menu items
        menu.clear()
        for (i in menuItems.indices) {
          menu.add(0, i, 0, menuItems[i])
        }
        return true
      }

      override fun onCreateActionMode(mode: ActionMode?, menu: Menu?): Boolean {
        return true
      }

      override fun onDestroyActionMode(mode: ActionMode?) {
        // Called when an action mode is about to be exited and
      }

      override fun onActionItemClicked(mode: ActionMode, item: MenuItem): Boolean {
        val selectionStart = view.selectionStart
        val selectionEnd = view.selectionEnd
        val selectedText = view.getText().toString().substring(selectionStart, selectionEnd)

        // Dispatch event
        onSelectNativeEvent(
          view, menuItems[item.itemId], selectedText, selectionStart, selectionEnd
        )
        mode.finish()
        return true
      }
    }
  }

  fun onSelectNativeEvent(
    view: ReactTextView,
    eventType: String?,
    content: String?,
    selectionStart: Int,
    selectionEnd: Int
  ) {
    val event = Arguments.createMap()
    event.putString("eventType", eventType)
    event.putString("content", content)
    event.putInt("start", selectionStart)
    event.putInt("end", selectionEnd)

    // Dispatch
    val reactContext = view.context as ReactContext
    reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(
      view.id, "topSelection", event
    )
  }

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.builder<String, Any>().put(
        "topSelection", MapBuilder.of(
          "registrationName", "onSelection"
        )
      ).build()
  }
}
