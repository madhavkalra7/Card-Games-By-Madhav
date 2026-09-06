$src = "public/INDIAN MEME SFX"
$dest = "public/sounds/memes"

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

$files = Get-ChildItem -Path $src

function CopyMatch($pattern, $targetName) {
    $found = $files | Where-Object { $_.Name -like $pattern } | Select-Object -First 1
    if ($found) {
        Copy-Item -Path $found.FullName -Destination "$dest/$targetName" -Force
        Write-Host "COPIED: $($found.Name) -> $targetName"
    } else {
        Write-Host "MISSING: $pattern"
    }
}

CopyMatch "*Abe bahar nikal*" "abe-bahar-nikal.mp3"
CopyMatch "*Abhi batata hu memes*" "ruk-abhi-batata-hu.mp3"
CopyMatch "*Accha Thik Hai Samaz Gaya Meme puneet Superstar*" "puneet-superstar.mp3"
CopyMatch "*Achcha... Amir Khan*" "aamir-khan-achha.mp3"
CopyMatch "*Are..o..bhai..oye*" "arey-o-bhai-oye.mp3"
CopyMatch "*Camera_Man_Jaldi_Focus_Karo*" "cameraman-focus.mp3"
CopyMatch "*Hello I*m under the Water*" "under-the-water.mp3"
CopyMatch "*Hey Bhagwan Kya Zulm Hai*" "hey-bhagwan-kya-zulm.mp3"
CopyMatch "*Hey_Prabhu_Hey_Hari_Ram*" "hey-prabhu.mp3"
CopyMatch "*Kya Haal hai.mp3*" "kya-haal-hai.mp3"
CopyMatch "*Lekin_ye_sala_kar_kya_rha_yha_pe_meme*" "akshay-kar-kya-raha-hai.mp3"
CopyMatch "*O Manchi Pushpa Raj*" "o-manchi-pushpa.mp3"
CopyMatch "*O Manchi.mp3*" "o-manchi-1.mp3"
CopyMatch "*O manchi(2)*" "o-manchi-2.mp3"
CopyMatch "*PICHE_TO_DEKHO_SOUND_EFFECT*" "peeche-dekho.mp3"
CopyMatch "*RIZZ.mp3*" "rizz.mp3"
CopyMatch "*Rajpal_Yadav_Shocking_reaction*" "rajpal-reaction.mp3"
CopyMatch "*Ruko_Jara_Sabar_Karo*" "ruko-zara.mp3"
CopyMatch "*Sanjay Dutt Nahi Meme*" "munna-bhai-nahi.mp3"
CopyMatch "*Shabash_Beta_Bahut_Badhiya*" "kaleen-bhaiya.mp3"
CopyMatch "*Wow beautiful meme*" "so-beautiful-so-elegant.mp3"
CopyMatch "*Ye le sms ringtone*" "ye-le-sms.mp3"
CopyMatch "*Yeh_Kya_Hai_-_CarryMinati*" "carryminati-yeh-kya-hai.mp3"
CopyMatch "*a kon he be Double ismart*" "ae-kaun-hai-be.mp3"
CopyMatch "*aayen viral meme*" "aayein.mp3"
CopyMatch "*abhi maza aayega na bhidu*" "abhi-maza-aayega.mp3"
CopyMatch "*ammi are bacha le*" "ammi-bacha-le.mp3"
CopyMatch "*baigan.mp3*" "baingan.mp3"
CopyMatch "*bap re meme sounds*" "baap-re-baap.mp3"
CopyMatch "*chalo meme*" "chalo-chalo.mp3"
CopyMatch "*funny memes video clips*kon hai eya*" "kaun-hai-ye.mp3"
CopyMatch "*hat be kon he tu*" "hat-be-kaun-hai-tu.mp3"
CopyMatch "*heii free fire*" "heii-free-fire.mp3"
CopyMatch "*i am a Magician O manchi*" "i-am-a-magician.mp3"
CopyMatch "*jaldi waha se hato*" "jaldi-waha-se-hato.mp3"
CopyMatch "*jhukega nahi sala pushpa*" "jhukega-nahi.mp3"
CopyMatch "*kaise kaise log rehte hai*" "kaise-kaise-log.mp3"
CopyMatch "*khelega free fire*" "khelega-free-fire.mp3"
CopyMatch "*kon he Be sms ringtone*" "kaun-hai-be-sms.mp3"
CopyMatch "*kuch_to_gadbad_hai_daya*" "cid-daya.mp3"
CopyMatch "*lekin_1second_Carry_Minati*" "carryminati-1-second.mp3"
CopyMatch "*pushpa raj.mp3*" "pushpa-raj-signature.mp3"
CopyMatch "*pushpa_pushpa_raj_dialogue_hindi*" "pushpa-fire-hai-main.mp3"
CopyMatch "*sale tuu*" "saale-tu.mp3"
CopyMatch "*ye_sab_kya_dekhna_pad_raha_hai*" "ye-sab-kya-dekhna-pad-raha.mp3"

Write-Host "Done! Count: $((Get-ChildItem $dest).Count)"
