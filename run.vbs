' =========================================================
' run.vbs  - PAN v2.0 完全非表示ランチャー
' =========================================================
' このファイルをダブルクリックするだけで起動できます。
' 黒いターミナル画面は一切表示されません。
' ブラウザを閉じると、裏のサーバーも自動的に終了します。
' =========================================================

Dim ws
Set ws = CreateObject("Wscript.Shell")

' %~dp0 相当：このVBSと同じフォルダのstart.batを絶対パスで実行
Dim scriptDir
scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' 第2引数: 0 = ウィンドウを完全に非表示
' 第3引数: False = 完了を待たずにすぐ制御を返す（即座にVBSを終了）
ws.Run "cmd /c """ & scriptDir & "start.bat""", 0, False

Set ws = Nothing
