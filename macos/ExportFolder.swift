import Foundation

/** An assets folder the person chose. The renderer names a fixed shape of relative files and never sees or picks a path;
 * a new sibling folder is filled completely first, so a failure leaves nothing and nothing existing is replaced. */
enum ExportFolder {
    static let assetExtensions:Set<String>=["svg","png","jpg"]
    static let fileLimit=201,byteLimit=150_000_000
    static func validPath(_ path:String)->Bool {
        if path=="manifest.json"{return true}
        guard path.hasPrefix("assets/") else{return false}
        let leaf=String(path.dropFirst(7))
        return !leaf.isEmpty&&!leaf.hasPrefix(".")&&leaf.utf8.count<=240&&!leaf.contains("/")&&!leaf.contains("\\")&&!leaf.contains(":")&&leaf.unicodeScalars.allSatisfy{$0.value>=32&&$0.value != 127}&&assetExtensions.contains((leaf as NSString).pathExtension.lowercased())
    }
    static func folderName(_ raw:String)->String? {
        let name=raw.trimmingCharacters(in:.whitespacesAndNewlines)
        guard !name.isEmpty,name.utf8.count<=200,!name.hasPrefix("."),!name.contains("/"),!name.contains(":"),!name.contains("\\"),name.unicodeScalars.allSatisfy({$0.value>=32&&$0.value != 127}) else{return nil}
        return name
    }
    static func decode(_ files:[[String:Any]])throws->[(String,Data)] {
        guard !files.isEmpty,files.count<=fileLimit else{throw NSError(domain:"Export between 1 and 200 assets.",code:1)}
        var seen=Set<String>(),total=0,out:[(String,Data)]=[]
        for file in files {
            guard let path=file["path"] as? String,validPath(path),seen.insert(path.lowercased()).inserted,let raw=file["data"] as? String,let bytes=Data(base64Encoded:raw) else{throw NSError(domain:"The asset folder contains an invalid file.",code:2)}
            total+=bytes.count;guard total<=byteLimit else{throw NSError(domain:"The assets exceed the folder export limit.",code:3)}
            out.append((path,bytes))
        }
        guard out.contains(where:{$0.0=="manifest.json"}) else{throw NSError(domain:"The asset folder has no manifest.",code:4)}
        return out
    }
    /** Returns the created folder's URL for the shell only. It is never sent to the renderer. */
    @discardableResult static func write(_ files:[(String,Data)],named name:String,in parent:URL)throws->URL {
        let manager=FileManager.default,staging=parent.appendingPathComponent(".forma-export-\(UUID().uuidString)",isDirectory:true)
        try manager.createDirectory(at:staging.appendingPathComponent("assets",isDirectory:true),withIntermediateDirectories:true)
        do{
            for (path,bytes) in files{try bytes.write(to:staging.appendingPathComponent(path),options:.withoutOverwriting)}
            for index in 1...1000 {
                let target=parent.appendingPathComponent(index==1 ? name:"\(name) \(index)",isDirectory:true)
                do{try manager.moveItem(at:staging,to:target);return target}catch let error as CocoaError where error.code == .fileWriteFileExists{continue}catch let error as NSError where error.domain==NSPOSIXErrorDomain&&error.code==Int(EEXIST){continue}
            }
            throw NSError(domain:"Choose a folder with fewer existing exports.",code:5)
        }catch{try? manager.removeItem(at:staging);throw error}
    }
}
