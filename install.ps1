if(Test-Path -Path build){
    Remove-Item -Path build -Confirm:$false
}
if(Test-Path -Path dist){
    Remove-Item -Path dist -Confirm:$false
}
New-Item -ItemType Directory -Path dist
Copy-Item -Path assets -Destination dist -Recurse
Copy-Item -Path csxs -Destination dist -Recurse
Copy-Item -Path node_modules -Destination dist -Recurse
Copy-Item -Path index.html -Destination dist -Recurse
Copy-Item -Path .debug -Destination dist -Recurse
Remove-Item -Path dist\assets\styles.scss -Confirm:$false
Remove-Item -Path dist\assets\styles.css.map -Confirm:$false

New-Item -ItemType Directory -Path build

[xml]$xmlElm = Get-Content -Path ".\csxs\manifest.xml";
$plugin_name = $xmlElm.ExtensionManifest.ExtensionBundleName;
$plugin_id = $xmlElm.ExtensionManifest.ExtensionBundleId;
$ver = $xmlElm.ExtensionManifest.ExtensionBundleVersion;
$source = $xmlElm.ExtensionManifest.Source;
$file = "${plugin_id}-${ver}.zip".ToLower();
$file_plugin = "${plugin_name}-${ver}.zxp".replace(" ", "-").ToLower();

echo "Installing ${plugin_name} ${ver}... takes a few minute"
.\..\ZXPSignCmd.exe -sign dist "build\${file_plugin}" .\..\certificate.p12 !pixflowFTW
Copy-Item -Path "build\${file_plugin}" -Destination "build\${file}"
.\..\ZXPSignCmd.exe -verify "build\${file_plugin}"

Remove-Item -Path dist -Confirm:$false
Remove-Item -Path "\\Server\Data-Sharing\Ali Shahimian\${plugin_id}*" -Confirm:$false
Remove-Item -Path "\\Server\Data-Sharing\Ali Shahimian\${plugin_name}*" -Confirm:$false
Copy-Item -Path "build\${file_plugin}" -Destination "\\Server\Data-Sharing\Ali Shahimian" -Force
Copy-Item -Path "build\${file}" -Destination "\\Server\Data-Sharing\Ali Shahimian" -Force

Remove-Item -Path build -Confirm:$false
